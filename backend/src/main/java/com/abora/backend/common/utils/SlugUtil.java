package com.abora.backend.common.utils;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public class SlugUtil {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");
    private static final Pattern EDGESDHASHES = Pattern.compile("(^-|-$)");
    private static final Pattern MULTIDASHES = Pattern.compile("-{2,}");

    public static String toSlug(String input) {
        if (input == null) return "";
        
        // Handle some common Vietnamese characters explicitly if needed, but Normalizer handles most.
        // Replace Đ/đ
        String temp = input.replace('đ', 'd').replace('Đ', 'd');
        
        String nowhitespace = WHITESPACE.matcher(temp).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        slug = MULTIDASHES.matcher(slug).replaceAll("-");
        slug = EDGESDHASHES.matcher(slug).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH);
    }
}
