package com.abora.backend.post.dto;

import com.abora.backend.post.PostType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreatePostRequest(
    @NotBlank(message = "Nội dung bài viết không được để trống")
    @Size(max = 2000, message = "Nội dung tối đa 2000 ký tự")
    String content,

    @NotNull(message = "Loại bài đăng không được để trống")
    PostType type
) {}
