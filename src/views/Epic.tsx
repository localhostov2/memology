import {
    $epicIsShowed,
    $popout,
    $snackbar,
    getUserFx,
    panelNames,
    Panels,
    routes,
    setPopout,
} from "@shared"
import { ITab } from "@types"
import {
    Icon28AddSquareOutline,
    Icon28GameOutline,
    Icon28NewsfeedOutline,
    Icon28PollSquareOutline,
    Icon28UserCardOutline,
} from "@vkontakte/icons"
import {
    EGetLaunchParamsResponsePlatforms,
    parseURLSearchParamsForGetLaunchParams,
} from "@vkontakte/vk-bridge"
import {
    useActiveVkuiLocation,
    useRouteNavigator,
} from "@vkontakte/vk-mini-apps-router"
import { useLocation } from "@vkontakte/vk-mini-apps-router/dist/hooks/hooks"
import { PanelPage } from "@vkontakte/vk-mini-apps-router/dist/page-types/PanelPage"
import { ViewConfig } from "@vkontakte/vk-mini-apps-router/dist/page-types/ViewConfig"
import {
    Cell,
    Epic as VKUIEpic,
    Group,
    Panel,
    PanelHeader,
    ScreenSpinner,
    SplitCol,
    SplitLayout,
    Tabbar,
    TabbarItem,
    useAdaptivityConditionalRender,
} from "@vkontakte/vkui"
import { useUnit } from "effector-react"
import { useEffect } from "react"
import { Modal } from "../modals"
import {
    Games,
    HistoryGame,
    Meme,
    Memes,
    Profile,
    Rating,
    Suggest,
} from "../panels"

export const Epic = () => {
    const { vk_platform } = parseURLSearchParamsForGetLaunchParams(
        window.location.search,
    )
    const { panel: activePanel, modal: activeModal } = useActiveVkuiLocation()
    const navigator = useRouteNavigator()
    const location = useLocation()
    const userIsLoading = useUnit(getUserFx.pending)
    const snackbar = useUnit($snackbar)
    const popout = useUnit($popout)
    const epicIsShowed = useUnit($epicIsShowed)

    const { viewWidth } = useAdaptivityConditionalRender()

    const activeStoryStyles = {
        backgroundColor: "var(--vkui--color_background_secondary)",
        borderRadius: 8,
    }

    const onStoryChange = (panel: PanelPage<string>) => {
        if (location.pathname === panel.path) return

        navigator.replace(panel)
    }

    const hasHeader =
        vk_platform! !== EGetLaunchParamsResponsePlatforms.DESKTOP_WEB

    const checkTabIsActive = (view: ViewConfig<string>) => {
        return view
            .getRoutes()
            .map((it) => it.panel)
            .includes(activePanel!)
    }

    const tabs: ITab[] = [
        {
            title: panelNames[Panels.MEMES],
            isActive: checkTabIsActive(routes.root.memes),
            route: routes.root.memes.memes,
            icon: <Icon28NewsfeedOutline />,
        },
        {
            title: panelNames[Panels.GAMES],
            isActive: checkTabIsActive(routes.root.games),
            route: routes.root.games.games,
            icon: <Icon28GameOutline />,
        },
        {
            title: panelNames[Panels.RATING],
            isActive: checkTabIsActive(routes.root.rating),
            route: routes.root.rating.rating,
            icon: <Icon28PollSquareOutline />,
        },
        {
            title: panelNames[Panels.PROFILE],
            isActive: checkTabIsActive(routes.root.profile),
            route: routes.root.profile.profile,
            icon: <Icon28UserCardOutline />,
        },
    ]

    const desktopTabs = tabs.map((tab) => {
        return (
            <Cell
                key={tab.title}
                disabled={tab.isActive}
                style={{
                    userSelect: "none",
                    ...(tab.isActive && activeStoryStyles),
                }}
                onClick={() => onStoryChange(tab.route)}
                before={tab.icon}
            >
                {tab.title}
            </Cell>
        )
    })

    const mobileTabs = tabs.map((tab) => {
        return (
            <TabbarItem
                key={tab.title}
                disabled={tab.isActive}
                onClick={() => onStoryChange(tab.route)}
                selected={tab.isActive}
                text={tab.title}
            >
                {tab.icon}
            </TabbarItem>
        )
    })

    useEffect(() => {
        if (userIsLoading) {
            setPopout(<ScreenSpinner state="loading" />)
        } else {
            setPopout(null)
        }

        return () => {
            setPopout(null)
        }
    }, [userIsLoading])

    return (
        <SplitLayout
            modal={<Modal activeModal={activeModal} />}
            popout={popout}
            header={hasHeader && <PanelHeader separator={false} />}
            style={{ justifyContent: "center" }}
        >
            {viewWidth.tabletPlus && epicIsShowed && (
                <SplitCol
                    className={viewWidth.tabletPlus.className}
                    fixed
                    width={280}
                    maxWidth={280}
                >
                    <Panel>
                        {hasHeader && <PanelHeader />}
                        <Group>{desktopTabs}</Group>
                        <Group>
                            <Cell
                                onClick={() => navigator.push("/suggest")}
                                before={<Icon28AddSquareOutline />}
                            >
                                Предложить мем
                            </Cell>
                        </Group>
                    </Panel>
                </SplitCol>
            )}

            <SplitCol
                width="100%"
                maxWidth="680px"
                stretchedOnMobile
                autoSpaced
            >
                <VKUIEpic
                    activeStory={activePanel ?? Panels.MEMES}
                    tabbar={
                        viewWidth.tabletMinus &&
                        epicIsShowed && (
                            <Tabbar className={viewWidth.tabletMinus.className}>
                                {mobileTabs}
                            </Tabbar>
                        )
                    }
                >
                    <Memes id={Panels.MEMES} />
                    <Games id={Panels.GAMES} />
                    <Meme id={Panels.MEME} />
                    <Rating id={Panels.RATING} />
                    <Suggest id={Panels.SUGGEST} />
                    <Profile id={Panels.PROFILE} />
                    <HistoryGame id={Panels.GAME_HISTORY} />
                </VKUIEpic>

                {snackbar}
            </SplitCol>
        </SplitLayout>
    )
}
