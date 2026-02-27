"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypewriterProps {
    text: string;
    delay?: number;
    speed?: number;
    onComplete?: () => void;
    className?: string;
}

export function Typewriter({ text, delay = 0, speed = 30, onComplete, className = "" }: TypewriterProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        setDisplayedText("");
        setIsComplete(false);

        let i = 0;
        let timeout: NodeJS.Timeout;

        const type = () => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                i++;
                timeout = setTimeout(type, speed);
            } else {
                setIsComplete(true);
                if (onComplete) onComplete();
            }
        };

        const startTimeout = setTimeout(type, delay);

        return () => {
            clearTimeout(timeout);
            clearTimeout(startTimeout);
        };
    }, [text, delay, speed, onComplete]);

    return (
        <span className={className}>
            {displayedText}
            {!isComplete && (
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                    className="inline-block w-1.5 h-4 ml-0.5 bg-current align-middle"
                />
            )}
        </span>
    );
}
