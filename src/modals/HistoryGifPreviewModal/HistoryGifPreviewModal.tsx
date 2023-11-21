import { downloadFile, GamesEffects } from "@shared"
import { IModalProps } from "@types"
import bridge from "@vkontakte/vk-bridge"
import { Button, ModalCard } from "@vkontakte/vkui"
import { useUnit } from "effector-react"

export const HistoryGifPreviewModal = ({ id }: IModalProps) => {
    const gifContent = useUnit(GamesEffects.History.$gifContent)!

    const downloadGif = () => {
        downloadFile(gifContent, "history.gif")
        bridge.send("VKWebAppDownloadFile", {
            url: gifContent.split("blob:")[1],
            filename: "history.gif",
        })
    }

    return (
        <ModalCard id={id}>
            <img src={gifContent} alt="" style={{ borderRadius: 14 }} />

            <div style={{ height: 16 }} />

            <Button stretched size="l" onClick={downloadGif}>
                Скачать GIF
            </Button>
        </ModalCard>
    )
}
