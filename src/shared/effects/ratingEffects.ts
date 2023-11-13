import { createEvent, createStore } from "effector"
import { TRatingTabListType } from "../../types"

export namespace RatingEffects {
    export const $selectedTab = createStore<TRatingTabListType>("eternal")

    export const selectTab = createEvent<TRatingTabListType>()

    $selectedTab.on(selectTab, (_, tab) => tab)
}
