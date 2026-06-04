package com.abora.backend.common.utils;

public class ChapterUtil {

    /**
     * Calculates the word count of the given content based on whitespace separation.
     */
    public static int calculateWordCount(String content) {
        if (content == null || content.trim().isEmpty()) {
            return 0;
        }
        return content.trim().split("\\s+").length;
    }

    /**
     * Calculates estimated reading time in minutes (assuming 200 words per minute).
     */
    public static int calculateEstimatedReadingTime(int wordCount) {
        if (wordCount <= 0) return 0;
        return (int) Math.ceil(wordCount / 200.0);
    }
}
