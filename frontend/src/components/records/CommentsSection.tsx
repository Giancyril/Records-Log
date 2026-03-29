import { useState, useRef } from "react";
import { useGetCommentsQuery, useCreateCommentMutation, useDeleteCommentMutation } from "../../redux/api/api";
import { toast } from "react-toastify";
import { FaTrash, FaPaperPlane } from "react-icons/fa";
import type { RecordComment } from "../../types/types";

const fmtTime = (d: string) =>
  new Date(d).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });

export default function CommentsSection({ recordId }: { recordId: string }) {
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading }                          = useGetCommentsQuery(recordId);
  const [createComment, { isLoading: submitting }]   = useCreateCommentMutation();
  const [deleteComment, { isLoading: deleting }]     = useDeleteCommentMutation();

  const comments: RecordComment[] = data?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await createComment({ recordId, content: content.trim() }).unwrap();
      setContent("");
      inputRef.current?.focus();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to add comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment({ recordId, commentId }).unwrap();
      toast.success("Comment deleted");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete comment");
    }
  };

  return (
    <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Internal Notes</h2>
        <span className="px-2 py-0.5 bg-white/5 border border-white/8 text-gray-400 text-[10px] font-bold rounded-lg">
          {comments.length}
        </span>
      </div>

      {/* Comment list */}
      <div className="divide-y divide-white/[0.04]">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-600 text-xs">No notes yet. Add the first one below.</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="px-5 py-3.5 group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-[9px] font-black">
                      {c.authorName?.charAt(0)?.toUpperCase() || "A"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white text-xs font-semibold">{c.authorName || "Admin"}</p>
                      <p className="text-gray-600 text-[10px]">{fmtTime(c.createdAt)}</p>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed break-words">{c.content}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deleting}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0 disabled:opacity-30"
                >
                  <FaTrash size={9} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-5 pb-5 pt-3 border-t border-white/5">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any); }
            }}
            placeholder="Add an internal note"
            rows={1}
            className="flex-1 px-3.5 py-2.5 bg-gray-800 border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none transition-all"
          />
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 flex items-center justify-center text-white transition-all shrink-0"
          >
            <FaPaperPlane size={12} />
          </button>
        </div>
      </form>
    </div>
  );
}