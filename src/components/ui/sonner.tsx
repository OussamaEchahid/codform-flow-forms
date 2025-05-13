
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: 
            "group-[.toast]:border-green-200 group-[.toast]:bg-green-50 group-[.toast]:text-green-800",
          warning:
            "group-[.toast]:border-amber-200 group-[.toast]:bg-amber-50 group-[.toast]:text-amber-800",
          error:
            "group-[.toast]:border-red-200 group-[.toast]:bg-red-50 group-[.toast]:text-red-800",
          info:
            "group-[.toast]:border-blue-200 group-[.toast]:bg-blue-50 group-[.toast]:text-blue-800",
        },
      }}
      {...props}
    />
  )
}

// Re-export toast from sonner without conflicts
export { Toaster }
export { toast } from "sonner"
