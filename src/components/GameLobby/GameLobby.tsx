import {
    $callLink,
    $vkUserData,
    GamesEffects,
    setCallLink,
    setSnackbar,
} from "@shared"
import { TGameModeType, TGameTabType, TSendFunction } from "@types"
import {
    Icon20LogoVkCallsOutline,
    Icon24ClockCircleDashedOutline,
    Icon24GearOutline,
    Icon24LinkedOutline,
    Icon24Play,
    Icon24UsersOutline,
    Icon24VolumeOutline,
} from "@vkontakte/icons"
import bridge from "@vkontakte/vk-bridge"
import { useParams, useRouteNavigator } from "@vkontakte/vk-mini-apps-router"
import {
    Button,
    HorizontalScroll,
    Placeholder,
    Select,
    SimpleCell,
    Snackbar,
    Spinner,
    Switch,
    Tabs,
    TabsItem,
} from "@vkontakte/vkui"
import { useList, useUnit } from "effector-react"
import { ReactElement, useState } from "react"
import { GameParticipantListItem } from "../GameParticipantListItem/GameParticipantListItem"
import styles from "./styles.module.css"

const { $users, setSettings, changeTTSStatus } = GamesEffects.History

export const GameLobby = ({ send }: { send: TSendFunction<TGameModeType> }) => {
    const navigator = useRouteNavigator()
    const users = useUnit($users)
    const vkUserData = useUnit($vkUserData)
    const [activeTab, setActiveTab] = useState<TGameTabType>("participants")
    const [callButtonLoading, setCallButtonLoading] = useState(false)
    const params = useParams<"roomId">()
    const gameOwner = users.find((user) => user.isOwner)
    const callLink = useUnit($callLink)

    const share = () => {
        navigator.push(`/games/history/${params?.roomId}/share`)
    }

    const tabContent: Record<TGameTabType, ReactElement> = {
        participants: ParticipantsTabContent(send),
        settings: SettingsTabContent({ send }),
    }

    const onStartGame = () => {
        send("startGame", {})
    }

    const callAction = () => {
        const isOwner = vkUserData?.id === gameOwner?.vkId

        if (isOwner) {
            setCallButtonLoading(true)

            bridge
                .send("VKWebAppCallStart")
                .then((data) => {
                    console.log(data)
                    if (data.result) {
                        setCallLink(data.join_link)
                        send("setCallData", {
                            link: data.join_link,
                        })
                    }
                })
                .catch(() => {
                    setSnackbar(
                        <Snackbar onClose={() => setSnackbar(null)}>
                            Произошла ошибка при создании звонка, попробуйте
                            снова
                        </Snackbar>,
                    )
                })
                .finally(() => setCallButtonLoading(false))
        } else if (callLink !== null) {
            bridge.send("VKWebAppCallJoin", {
                join_link: callLink,
            })
        }
    }

    return users.length === 0 ? (
        <Placeholder
            header="Создаём комнату"
            icon={<Spinner size="large" />}
            children="Загружаем всё необходимое"
        />
    ) : (
        <div>
            <Tabs>
                <HorizontalScroll arrowSize="m">
                    <TabsItem
                        before={<Icon24UsersOutline />}
                        selected={activeTab === "participants"}
                        onClick={() => setActiveTab("participants")}
                        status={users.length}
                    >
                        Участники
                    </TabsItem>

                    <TabsItem
                        before={<Icon24GearOutline />}
                        selected={activeTab === "settings"}
                        onClick={() => setActiveTab("settings")}
                    >
                        Настройки
                    </TabsItem>
                </HorizontalScroll>
            </Tabs>

            <div className={styles.container}>
                <div className={styles.buttons}>
                    <Button
                        size="l"
                        stretched
                        mode="secondary"
                        before={<Icon24LinkedOutline />}
                        onClick={share}
                    >
                        Пригласить
                    </Button>

                    <Button
                        stretched
                        size="l"
                        onClick={callAction}
                        loading={callButtonLoading}
                        before={
                            <Icon20LogoVkCallsOutline
                                style={{ width: 24, height: 24 }}
                            />
                        }
                        disabled={
                            vkUserData?.id !== gameOwner?.vkData.id && !callLink
                        }
                    >
                        {vkUserData?.id === gameOwner?.vkData.id
                            ? callLink
                                ? "Перезапустить звонок"
                                : "Начать звонок"
                            : "Присоединиться к звонку"}
                    </Button>
                </div>

                <div style={{ height: 8 }} />

                {vkUserData?.id === gameOwner?.vkId && (
                    <Button
                        size="l"
                        stretched
                        before={<Icon24Play />}
                        onClick={onStartGame}
                    >
                        Начать игру
                    </Button>
                )}

                <div style={{ height: 16 }} />

                <div>{tabContent[activeTab]}</div>
            </div>
        </div>
    )
}

const ParticipantsTabContent = (send: TSendFunction<TGameModeType>) => {
    const users = useUnit(GamesEffects.History.$users)
    const gameOwner = users.find((it) => it.isOwner)
    const usersList = useList(GamesEffects.History.$users, (item) => (
        <div key={item.vkId}>
            <GameParticipantListItem
                item={item}
                send={send}
                ownerId={gameOwner?.vkId}
            />
        </div>
    ))

    return (
        <div>
            <div className={styles.usersList}>{usersList}</div>
        </div>
    )
}

const SettingsTabContent = ({ send }: { send: TSendFunction<"history"> }) => {
    const users = useUnit(GamesEffects.History.$users)
    const settings = useUnit(GamesEffects.History.$settings)
    const isTTSEnabled = useUnit(GamesEffects.History.$isTTSEnabled)
    const currentVkUser = useUnit($vkUserData)
    const isOwner = Boolean(
        users.find((it) => it.vkId === currentVkUser?.id && it.isOwner),
    )
    const isSupportTTS = "speechSynthesis" in window

    function updateSettings(
        settings: NonNullable<Parameters<typeof setSettings>[0]>,
    ) {
        setSettings(settings)
        send("changeSettings", settings)
    }

    return (
        <div>
            <SimpleCell
                before={<Icon24ClockCircleDashedOutline />}
                subtitle="На один раунд будет даваться это количество времени"
                disabled
                multiline
                after={
                    <Select
                        value={settings.roundTime}
                        disabled={!isOwner}
                        onChange={(e) =>
                            updateSettings({
                                ...settings,
                                roundTime: Number(e.target.value),
                            })
                        }
                        options={[
                            { label: "15 с.", value: 15 },
                            { label: "20 с.", value: 20 },
                            { label: "30 с.", value: 30 },
                            { label: "45 с.", value: 45 },
                            { label: "60 с.", value: 60 },
                        ]}
                    />
                }
            >
                Время раунда
            </SimpleCell>

            <SimpleCell
                before={<Icon24VolumeOutline />}
                subtitle={isSupportTTS ? "Поддерживается" : "Не поддерживается"}
                disabled
                multiline
                after={
                    isSupportTTS ? (
                        <Switch
                            checked={isTTSEnabled}
                            onChange={() => changeTTSStatus()}
                        />
                    ) : (
                        <></>
                    )
                }
            >
                Преобразование текста в речь
            </SimpleCell>
        </div>
    )
}
