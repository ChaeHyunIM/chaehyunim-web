import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { encode } from "qss";
import React, { useState, useEffect } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils";

type LinkPreviewProps = {
  children: React.ReactNode;
  url: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  title?: string;
} & (
  | { isStatic: true; imageSrc: string }
  | { isStatic?: false; imageSrc?: never }
);

const LinkPreview = ({
  children,
  url,
  className,
  width = 200,
  height = 125,
  isStatic = false,
  imageSrc = "",
  title,
}: LinkPreviewProps) => {
  const [src, setSrc] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isStatic) {
      const params = encode({
        url,
        screenshot: true,
        meta: false,
        embed: "screenshot.url",
        colorScheme: "dark",
        "viewport.isMobile": true,
        "viewport.deviceScaleFactor": 1,
        "viewport.width": width * 3,
        "viewport.height": height * 3,
      });
      setSrc(`https://api.microlink.io/?${params}`);
    } else {
      setSrc(imageSrc);
    }
  }, [url, isStatic, imageSrc, width, height]);

  const [isOpen, setOpen] = useState(false);

  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const translateX = useSpring(x, springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const targetRect = event.currentTarget.getBoundingClientRect();
    const eventOffsetX = event.clientX - targetRect.left;
    const offsetFromCenter = (eventOffsetX - targetRect.width / 2) / 2;
    x.set(offsetFromCenter);
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  return (
    <HoverCardPrimitive.Root
      openDelay={50}
      closeDelay={100}
      onOpenChange={setOpen}
    >
      <HoverCardPrimitive.Trigger
        title={title}
        onMouseMove={handleMouseMove}
        className={cn("group inline-block hover:text-skin-accent", className)}
        href={url}
      >
        {children}
      </HoverCardPrimitive.Trigger>

      <HoverCardPrimitive.Content
        className="[transform-origin:var(--radix-hover-card-content-transform-origin)]"
        side="top"
        align="center"
        sideOffset={10}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.6 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                },
              }}
              exit={{ opacity: 0, y: 20, scale: 0.6 }}
              className="rounded-xl shadow-xl"
              style={{ x: translateX }}
            >
              <a
                title={title}
                href={url}
                className="block rounded-xl border-2 border-transparent bg-white p-1 shadow hover:border-neutral-200 dark:hover:border-neutral-800"
                style={{ fontSize: 0 }}
              >
                {src && (
                  <img
                    src={src}
                    width={width}
                    height={height}
                    className={`rounded-lg ${isLoaded ? "opacity-100" : "opacity-0"}`}
                    alt="preview image"
                    loading="lazy"
                    onLoad={handleImageLoad}
                    style={{
                      transition: "opacity 0.3s ease-in-out",
                    }}
                  />
                )}
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Root>
  );
};

export default LinkPreview;
