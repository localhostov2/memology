import { createComment } from "@shared"
import { IModalProps } from "@types"
import { useRouteNavigator } from "@vkontakte/vk-mini-apps-router"
import { Button, FormItem, ModalCard, Textarea } from "@vkontakte/vkui"
import { useState } from "react"

export const CreateMemeCommentModal = ({ id }: IModalProps) => {
    const navigator = useRouteNavigator()
    const [text, setText] = useState("")

    const createCommentText = () => {
        createComment(text)
        navigator.hideModal()
    }

    return (
        <ModalCard id={id}>
            <FormItem
                top={`Опишите увиденное • ${
                    text.trim().length
                } / ${MAX_COMMENT_LENGTH}`}
                style={{ padding: 0 }}
            >
                <Textarea
                    value={text}
                    maxLength={MAX_COMMENT_LENGTH}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Этот мем такой классный, смеялись всем селом"
                />
            </FormItem>

            <div style={{ height: 16 }} />

            <Button
                size="l"
                mode={text.trim().length > 0 ? "primary" : "secondary"}
                disabled={text.trim().length === 0}
                onClick={createCommentText}
            >
                Оставить комментарий
            </Button>
        </ModalCard>
    )
}

const MAX_COMMENT_LENGTH = 256
