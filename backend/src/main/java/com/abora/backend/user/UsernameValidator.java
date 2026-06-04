package com.abora.backend.user;

import com.abora.backend.common.exception.BadRequestException;

import java.util.Set;
import java.util.regex.Pattern;

public class UsernameValidator {

    private static final Set<String> RESERVED_KEYWORDS = Set.of(
            "admin", "administrator", "root", "system", "moderator",
            "login", "register", "signup", "signin", "logout", "auth",
            "forgot-password", "reset-password", "verify-email", "oauth2",
            "home", "dashboard", "explore", "forum", "library", "studio", "settings",
            "story", "stories", "chapter", "chapters", "author", "user", "users",
            "profile", "account", "me", "api", "search", "messages", "notifications",
            "about", "contact", "terms", "privacy", "help", "support", "faq",
            "error", "404", "500", "index", "default", "null", "undefined"
    );

    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-z0-9_]{3,30}$");

    public static void validateUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            throw new BadRequestException("Tên người dùng không được để trống.");
        }

        String lowerUsername = username.trim().toLowerCase();

        if (!USERNAME_PATTERN.matcher(lowerUsername).matches()) {
            throw new BadRequestException("Tên người dùng chỉ được chứa chữ cái thường, số, dấu gạch dưới và dài từ 3 đến 30 ký tự.");
        }

        if (RESERVED_KEYWORDS.contains(lowerUsername)) {
            throw new BadRequestException("Tên người dùng này đã được bảo lưu bởi hệ thống.");
        }
    }
}
