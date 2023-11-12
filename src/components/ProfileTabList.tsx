import { useRouteNavigator } from "@vkontakte/vk-mini-apps-router"
import { Search } from "@vkontakte/vkui"
import { useUnit } from "effector-react"
import { useEffect } from "react"
import { ProfileEffects } from "../shared"
import styles from "../styles/profile.module.css"
import { TListType } from "../types"
import { MemeListItem } from "./MemeListItem"

interface Props {
    type: TListType
}

const searchPlaceholder: Record<TListType, string> = {
    like: "Искать в лайках",
    dislike: "Искать в дизлайках",
    favorite: "Искать в избранных",
}

export function ProfileTabList({ type }: Props) {
    const navigator = useRouteNavigator()
    const memes = useUnit(ProfileEffects.$memesList)
    const search = useUnit(ProfileEffects.$memesSearch)

    useEffect(() => {
        ProfileEffects.fetchMemes()
    }, [])

    const openModal = (memeId: number) => {
        navigator.push(`/me/profileMemeListActions/${type}/${memeId}`)
    }

    return (
        <>
            <Search
                value={search}
                onChange={(e) => ProfileEffects.searchMeme(e.target.value)}
                after={null}
                placeholder={searchPlaceholder[type]}
            />
            <div className={styles.tabContentContainer}>
                <div className={styles.cardsContainer}>
                    {memes.map((item) => (
                        <MemeListItem
                            key={item.id}
                            item={item}
                            onClick={openModal}
                        />
                    ))}
                </div>
            </div>
        </>
    )
}
