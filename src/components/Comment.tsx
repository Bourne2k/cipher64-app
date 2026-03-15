import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

export function Comment({ comment }: { comment: string }) {
    const multipleLine = comment.split("\n").filter((v) => v.trim() !== "").length > 1;

    // We map the markdown elements directly to Tailwind classes 
    // so we don't need Mantine's TypographyStylesProvider to make it look good.
    return (
        <div
            className={`text-sm text-foreground/90 leading-relaxed ${multipleLine ? "block" : "inline"}`}
        >
            <Markdown
                components={{
                    a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium" />
                    ),
                    p: ({ children }) => (
                        <span
                            style={{
                                display: multipleLine ? "block" : "inline",
                                marginBottom: multipleLine ? "0.5rem" : 0,
                            }}
                        >
                            {children}
                        </span>
                    ),
                    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => (
                        <code className="bg-muted text-foreground px-1.5 py-0.5 rounded-sm font-mono text-[11px] font-semibold border border-border/50">
                            {children}
                        </code>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2">
                            {children}
                        </blockquote>
                    )
                }}
                rehypePlugins={[rehypeRaw, remarkGfm]}
            >
                {comment}
            </Markdown>
        </div>
    );
}