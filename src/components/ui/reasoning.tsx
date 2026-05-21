"use client"

import { ChevronDownIcon } from "lucide-react"
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"

import { cn } from "@/lib/utils"

import { Markdown } from "./markdown"

type ReasoningContextType = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const ReasoningContext = createContext<ReasoningContextType | undefined>(
  undefined
)

export type ReasoningContentProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
  className?: string
  contentClassName?: string
  markdown?: boolean
}

export type ReasoningProps = {
  children: React.ReactNode
  className?: string
  isStreaming?: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
}
export type ReasoningTriggerProps = React.HTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
  className?: string
}

function Reasoning({
  children,
  className,
  isStreaming,
  onOpenChange,
  open,
}: ReasoningProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [prevIsStreaming, setPrevIsStreaming] = useState(isStreaming)
  const [wasAutoOpened, setWasAutoOpened] = useState(false)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  // Adjust state during render when isStreaming changes (React derived-state-from-props pattern)
  if (prevIsStreaming !== isStreaming) {
    setPrevIsStreaming(isStreaming)
    if (isStreaming && !wasAutoOpened) {
      setWasAutoOpened(true)
      if (!isControlled) setInternalOpen(true)
    } else if (!isStreaming && wasAutoOpened) {
      setWasAutoOpened(false)
      if (!isControlled) setInternalOpen(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  return (
    <ReasoningContext.Provider
      value={{
        isOpen,
        onOpenChange: handleOpenChange,
      }}
    >
      <div className={className}>{children}</div>
    </ReasoningContext.Provider>
  )
}

function ReasoningContent({
  children,
  className,
  contentClassName,
  markdown = false,
  ...props
}: ReasoningContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const { isOpen } = useReasoningContext()

  useEffect(() => {
    if (!contentRef.current || !innerRef.current) return

    const observer = new ResizeObserver(() => {
      if (contentRef.current && innerRef.current && isOpen) {
        contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`
      }
    })

    observer.observe(innerRef.current)

    if (isOpen) {
      contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`
    }

    return () => observer.disconnect()
  }, [isOpen])

  const content = markdown ? (
    <Markdown>{children as string}</Markdown>
  ) : (
    children
  )

  return (
    <div
      className={cn(
        "overflow-hidden transition-[max-height] duration-150 ease-out",
        className
      )}
      ref={contentRef}
      style={{
        maxHeight: isOpen ? undefined : "0px",
      }}
      {...props}
    >
      <div
        className={cn(
          "overflow-hidden text-muted-foreground prose prose-sm dark:prose-invert max-w-none",
          contentClassName
        )}
        ref={innerRef}
      >
        {content}
      </div>
    </div>
  )
}

function ReasoningTrigger({
  children,
  className,
  ...props
}: ReasoningTriggerProps) {
  const { isOpen, onOpenChange } = useReasoningContext()

  return (
    <button
      className={cn("flex cursor-pointer items-center gap-2", className)}
      onClick={() => onOpenChange(!isOpen)}
      {...props}
    >
      <span className="text-primary">{children}</span>
      <div
        className={cn(
          "transform transition-transform",
          isOpen ? "rotate-180" : ""
        )}
      >
        <ChevronDownIcon className="size-4" />
      </div>
    </button>
  )
}

function useReasoningContext() {
  const context = useContext(ReasoningContext)
  if (!context) {
    throw new Error(
      "useReasoningContext must be used within a Reasoning provider"
    )
  }
  return context
}

export { Reasoning, ReasoningContent, ReasoningTrigger }
