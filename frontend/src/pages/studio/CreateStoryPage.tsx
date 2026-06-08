import React, { useState, useRef } from "react";
import { ImageCropperModal } from "../../components/ui/ImageCropperModal";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { Button } from "../../components/ui/Button";
import { ArrowLeft, Edit2, Info, X } from "lucide-react";
import "./Studio.css";

export const CreateStoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState("");
  const [ageRating, setAgeRating] = useState("EVERYONE");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get("/categories");
      return data;
    },
  });

  const toggleCategory = (id: number) => {
    if (selectedCategoryIds.includes(id)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((x) => x !== id));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    }
  };

  const createStoryMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title || "Truyện Chưa Có Tiêu Đề",
        description,
        contentWarning: null,
        ageRating,
        categoryIds: selectedCategoryIds,
        tags,
      };
      const { data: story } = await api.post("/stories", payload);

      if (coverFile) {
        const formData = new FormData();
        formData.append("file", coverFile);
        await api.post(`/stories/${story.id}/cover`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      return story.id;
    },
    onSuccess: (storyId) => {
      toast.success("Tạo truyện mới thành công!");
      navigate(`/studio/story/${storyId}/chapters`);
    },
    onError: (error: any) => {
      console.error("Lỗi khi tạo truyện:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Lỗi không xác định";
      alert(
        `Đã xảy ra lỗi khi tạo truyện: ${errorMsg}\nHãy báo lại lỗi này cho tôi!`,
      );
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setCropperOpen(true);
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = currentTagInput.trim().replace(/,$/, "");
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setCurrentTagInput("");
    } else if (e.key === " " && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const newTag = currentTagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setCurrentTagInput("");
    } else if (
      e.key === "Backspace" &&
      currentTagInput === "" &&
      tags.length > 0
    ) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleTagInputBlur = () => {
    const newTag = currentTagInput.trim().replace(/,$/, "");
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setCurrentTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // console.log(
    //   "Token hiện tại trong Store trước khi gửi:",
    //   useAuthStore.getState().token,
    // );
    createStoryMutation.mutate();
  };

  return (
    <div className="studio-container fade-in" style={{ paddingTop: '6px' }}>
      {/* Sub Header */}
      <div className="studio-sub-header" style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem' }}>
        <Button
          variant="ghost"
          className="px-2"
          onClick={() => navigate("/studio")}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="studio-title mb-0 flex-1 text-center">Tạo Truyện Mới</h1>
        <div style={{ width: 64 }}></div>
      </div>

      <form onSubmit={handleSubmit} className="create-story-layout">
        {/* Cột trái 30% */}
        <div className="create-story-left">
          <div className="cover-upload-wrapper">
            {coverPreview ? (
              <img
                src={coverPreview}
                alt="Cover Preview"
                className="cover-upload-image"
              />
            ) : (
              <div className="cover-upload-placeholder">
                <span className="text-secondary text-sm">Chưa có ảnh bìa</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={createStoryMutation.isPending}
            />
            <button
              type="button"
              className="cover-edit-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Đổi ảnh bìa"
            >
              <Edit2 size={16} />
            </button>
          </div>
        </div>

        {/* Cột phải 70% */}
        <div className="create-story-right glass-panel">
          <div className="section-header">
            <h2 className="section-title">Chi Tiết Truyện</h2>
          </div>

          <div className="form-group mt-6">
            <label className="form-label">Tiêu đề truyện</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Truyện Chưa Có Tiêu Đề"
              disabled={createStoryMutation.isPending}
            />
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-1">
              Mô tả truyện <Info size={14} className="text-secondary" />
            </label>
            <textarea
              className="form-textarea"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu nội dung chính..."
              disabled={createStoryMutation.isPending}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Thẻ Tag </label>
            <div className="tag-input-container">
              {tags.map((tag) => (
                <div key={tag} className="tag-chip">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="tag-remove-btn"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <input
                type="text"
                className="tag-input-field"
                value={currentTagInput}
                onChange={(e) => setCurrentTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                onBlur={handleTagInputBlur}
                placeholder={tags.length === 0 ? "Bấm cách, dấu phẩy hoặc Enter để tạo thẻ" : ""}
                disabled={createStoryMutation.isPending}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Thể loại <span style={{ color: "#ef4444", fontWeight: "bold" }}>*</span>
            </label>
            {selectedCategoryIds.length === 0 && (
              <div style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                Vui lòng chọn ít nhất một thể loại cho truyện của bạn.
              </div>
            )}
            <div className="category-grid">
              {categories.map((cat: any) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    className={`category-chip-selectable ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleCategory(cat.id)}
                    title={cat.description}
                  >
                    {cat.name}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Độ tuổi</label>
            <select
              className="form-select"
              value={ageRating}
              onChange={(e) => setAgeRating(e.target.value)}
              disabled={createStoryMutation.isPending}
            >
              <option value="EVERYONE">Mọi lứa tuổi (Everyone)</option>
              <option value="TEEN">Thiếu niên (13+)</option>
              <option value="MATURE">Trưởng thành (18+)</option>
            </select>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={createStoryMutation.isPending}
              disabled={selectedCategoryIds.length === 0}
            >
              Lưu lại và Tiếp tục
            </Button>
          </div>
        </div>
      </form>
      <ImageCropperModal
        isOpen={cropperOpen}
        imageFile={selectedFile}
        aspect={2 / 3}
        onClose={() => {
          setCropperOpen(false);
          setSelectedFile(null);
        }}
        onCropConfirm={(croppedFile) => {
          setCoverFile(croppedFile);
          setCoverPreview(URL.createObjectURL(croppedFile));
          setCropperOpen(false);
          setSelectedFile(null);
        }}
      />
    </div>
  );
};
