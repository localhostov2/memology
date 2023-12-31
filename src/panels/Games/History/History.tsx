import { GameLobby } from "@components"
import {
    $vkUserData,
    changeEpicVisibility,
    GamesEffects,
    Modals,
    panelNames,
    setCallLink,
    setSnackbar,
    useWebsocket,
} from "@shared"
import { IGameParticipant, IPanelProps, TGameHistoryStepType } from "@types"
import { Icon24Cancel } from "@vkontakte/icons"
import bridge from "@vkontakte/vk-bridge"
import { useRouteNavigator } from "@vkontakte/vk-mini-apps-router"
import {
    Group,
    Panel,
    PanelHeader,
    PanelHeaderButton,
    Snackbar,
} from "@vkontakte/vkui"
import { useUnit } from "effector-react"
import { ReactElement, useEffect } from "react"
import { ShowResult, WaitResult, WriteHistory } from "./steps"
import styles from "./styles.module.css"

const {
    $gameStep,
    $gifContent,
    $currentChatRoot,
    $isStarted,
    setSettings,
    $settings,
} = GamesEffects.History

export const HistoryGame = ({ id }: IPanelProps) => {
    const navigator = useRouteNavigator()
    const isStarted = useUnit($isStarted)
    const currentChatRoot = useUnit($currentChatRoot)
    const gifs = useUnit($gifContent)
    //TODO: auto store
    const gifContent = gifs.find((x) => x.dialogId === currentChatRoot)
    const gameStep = useUnit($gameStep)
    const vkUserData = useUnit($vkUserData)
    const settings = useUnit($settings)

    const { send } = useWebsocket(
        "history",
        {
            lobbyInfo: async (msg) => {
                setSettings(msg.settings!)
                if (msg.callLink) setCallLink(msg.callLink)

                // TODO: place in effects
                const result: IGameParticipant[] = []

                for await (const user of msg.users) {
                    const vkData = await bridge.send("VKWebAppGetUserInfo", {
                        user_id: user.vkId,
                    })

                    result.push(Object.assign(user, { vkData }))
                }

                GamesEffects.History.addUser(result)
            },
            showSnackbar: (msg) =>
                setSnackbar(
                    <Snackbar onClose={() => setSnackbar(null)}>
                        {msg.message}
                    </Snackbar>,
                ),
            userJoined: async (msg) => {
                const vkData = await bridge.send("VKWebAppGetUserInfo", {
                    user_id: msg.vkId,
                })

                GamesEffects.History.addUser([Object.assign(msg, { vkData })])
            },
            userLeaved: (msg) => {
                GamesEffects.History.deleteUser(msg)

                if (msg.vkId === vkUserData?.id) {
                    navigator.replace("/games")
                    setSnackbar(
                        <Snackbar onClose={() => setSnackbar(null)}>
                            Вы были исключены из этой комнаты
                        </Snackbar>,
                    )
                }
            },
            startLobby: () => {
                GamesEffects.History.setTime(settings.roundTime)
                GamesEffects.History.setStart(true)
            },
            timerTick: ({ time }) => GamesEffects.History.setTime(time),
            nextStep: ({ previousContext }) =>
                GamesEffects.History.nextStep(previousContext),
            finishGame: (msg) => {
                GamesEffects.History.setMessages(msg.dialogs)
                GamesEffects.History.setGameStep("readyResult")
            },
            gameGif: ({ dialogId, buffer, vkAttachment }) => {
                GamesEffects.History.setGifBuffer({
                    dialogId,
                    buffer,
                    vkAttachment,
                })
            },
            readyCounter: (num) => GamesEffects.History.setReadyCount(num),
            newGame: () => {
                GamesEffects.History.setStart(false)
                GamesEffects.History.setGameStep("meWrite")
            },
            showDialog: ({ dialogId }) => {
                if (gameStep !== "showResult")
                    GamesEffects.History.setGameStep("showResult")
                GamesEffects.History.setChatRoot(dialogId)
            },
            callData: ({ link }) => setCallLink(link ?? null),
            settingsUpdate: (settings) => setSettings(settings),
        },
        {
            onClose: () => {
                navigator.replace("/games")
                setSnackbar(
                    <Snackbar onClose={() => setSnackbar(null)}>
                        Лобби игры «История» больше не доступно
                    </Snackbar>,
                )
            },
        },
    )

    useEffect(() => {
        changeEpicVisibility(false)
        GamesEffects.History.setGameStep("meWrite")

        return () => {
            changeEpicVisibility(true)
            if (gifContent) URL.revokeObjectURL(gifContent.link)
        }
    }, [])

    const currentGameStep: Record<TGameHistoryStepType, ReactElement> = {
        meWrite: WriteHistory({ send }),
        readyResult: WaitResult({ send }),
        showResult: ShowResult({ send }),
    }

    return (
        <Panel id={id}>
            <PanelHeader
                before={
                    <PanelHeaderButton
                        onClick={() =>
                            navigator.showModal(
                                Modals.EXIT_FROM_GAME_CONFIRMATION,
                            )
                        }
                    >
                        <Icon24Cancel />
                    </PanelHeaderButton>
                }
            >
                {panelNames[id]}
            </PanelHeader>

            <Group>
                {isStarted ? (
                    <div className={styles.container}>
                        {currentGameStep[gameStep]}
                    </div>
                ) : (
                    <GameLobby send={send} />
                )}
            </Group>
        </Panel>
    )
}
