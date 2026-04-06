"use client"

import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type PromptInputContextType = {
  disabled?: boolean
  isLoading: boolean
  maxHeight: number | string
  onSubmit?: () => void
  setValue: (value: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
}

const PromptInputContext = createContext<PromptInputContextType>({
  disabled: false,
  isLoading: false,
  maxHeight: 240,
  onSubmit: undefined,
  setValue: () => {},
  textareaRef: React.createRef<HTMLTextAreaElement>(),
  value: "",
})

export type PromptInputActionProps = React.ComponentProps<typeof Tooltip> & {
  children: React.ReactNode
  className?: string
  side?: "bottom" | "left" | "right" | "top"
  tooltip: React.ReactNode
}

export type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>

export type PromptInputProps = React.ComponentProps<"div"> & {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  isLoading?: boolean
  maxHeight?: number | string
  onSubmit?: () => void
  onValueChange?: (value: string) => void
  value?: string
}

export type PromptInputTextareaProps = React.ComponentProps<typeof Textarea> & {
  disableAutosize?: boolean
}

function PromptInput({
  children,
  className,
  disabled = false,
  isLoading = false,
  maxHeight = 240,
  onClick,
  onSubmit,
  onValueChange,
  value,
  ...props
}: PromptInputProps) {
  const [internalValue, setInternalValue] = useState(value || "")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = (newValue: string) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
  }

  const handleClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!disabled) textareaRef.current?.focus()
    onClick?.(e)
  }

  return (
    <TooltipProvider>
      <PromptInputContext.Provider
        value={{
          disabled,
          isLoading,
          maxHeight,
          onSubmit,
          setValue: onValueChange ?? handleChange,
          textareaRef,
          value: value ?? internalValue,
        }}
      >
        <div
          className={cn(
            "border-input bg-background cursor-text rounded-3xl border p-2 shadow-xs",
            disabled && "cursor-not-allowed opacity-60",
            className
          )}
          onClick={handleClick}
          {...props}
        >
          {children}
        </div>
      </PromptInputContext.Provider>
    </TooltipProvider>
  )
}

function PromptInputAction({
  children,
  className,
  side = "top",
  tooltip,
  ...props
}: PromptInputActionProps) {
  const { disabled } = usePromptInput()

  return (
    <Tooltip {...props}>
      <TooltipTrigger
        asChild
        disabled={disabled || undefined}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className={className} side={side}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

function PromptInputActions({
  children,
  className,
  ...props
}: PromptInputActionsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  )
}

function PromptInputTextarea({
  className,
  disableAutosize = false,
  onKeyDown,
  ...props
}: PromptInputTextareaProps) {
  const { disabled, maxHeight, onSubmit, setValue, textareaRef, value } =
    usePromptInput()

  const adjustHeight = (el: HTMLTextAreaElement | null) => {
    if (!el || disableAutosize) return

    el.style.height = "auto"

    if (typeof maxHeight === "number") {
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    } else {
      el.style.height = `min(${el.scrollHeight}px, ${maxHeight})`
    }
  }

  const handleRef = (el: HTMLTextAreaElement | null) => {
    textareaRef.current = el
    adjustHeight(el)
  }

  useLayoutEffect(() => {
    if (!textareaRef.current || disableAutosize) return

    const el = textareaRef.current
    el.style.height = "auto"

    if (typeof maxHeight === "number") {
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    } else {
      el.style.height = `min(${el.scrollHeight}px, ${maxHeight})`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, maxHeight, disableAutosize])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight(e.target)
    setValue(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit?.()
    }
    onKeyDown?.(e)
  }

  return (
    <Textarea
      className={cn(
        "text-primary min-h-11 w-full resize-none border-none bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className
      )}
      disabled={disabled}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      ref={handleRef}
      rows={1}
      value={value}
      {...props}
    />
  )
}

function usePromptInput() {
  return useContext(PromptInputContext)
}

export {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
}
