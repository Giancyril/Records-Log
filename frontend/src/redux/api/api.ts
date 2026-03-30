import { baseApi } from "./baseApi";

const api = baseApi.injectEndpoints({
  endpoints: (build) => ({

    // ── Auth ──────────────────────────────────────────────────────────────
    login: build.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    registerAdmin: build.mutation({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      invalidatesTags: ["admins"],
    }),
    getAdmins: build.query({
      query: () => "/auth/admins",
      providesTags: ["admins"],
    }),
    deleteAdmin: build.mutation({
      query: (id: string) => ({ url: `/auth/admins/${id}`, method: "DELETE" }),
      invalidatesTags: ["admins"],
    }),
    changePassword: build.mutation({
      query: (body) => ({ url: "/auth/change-password", method: "PUT", body }),
    }),
    changeEmail: build.mutation({
      query: (body) => ({ url: "/auth/change-email", method: "PUT", body }),
    }),
    changeUsername: build.mutation({
      query: (body) => ({ url: "/auth/change-username", method: "PUT", body }),
    }),

    // ── Public tracking (no auth needed) ─────────────────────────────────
    trackRecord: build.query({
      query: (trackingCode: string) => `/track/${trackingCode}`,
    }),

    // ── Records ───────────────────────────────────────────────────────────
    getRecords: build.query({
      query: (params) => ({ url: "/records", params }),
      providesTags: ["records"],
    }),
    getSingleRecord: build.query({
      query: (id: string) => `/records/${id}`,
      providesTags: ["records"],
    }),
    getRecordStats: build.query({
      query: () => "/records/stats",
      providesTags: ["stats"],
    }),
    createRecord: build.mutation({
      query: (body) => ({ url: "/records", method: "POST", body }),
      invalidatesTags: ["records", "stats"],
    }),
    updateRecord: build.mutation({
      query: ({ id, ...body }) => ({ url: `/records/${id}`, method: "PUT", body }),
      invalidatesTags: ["records", "stats"],
    }),
    receiveRecord: build.mutation({
      query: ({ id, ...body }) => ({ url: `/records/${id}/receive`, method: "PUT", body }),
      invalidatesTags: ["records", "stats"],
    }),
    releaseRecord: build.mutation({
      query: ({ id, ...body }) => ({ url: `/records/${id}/release`, method: "PUT", body }),
      invalidatesTags: ["records", "stats"],
    }),

    // ── Bulk receive / release ────────────────────────────────────────────
    bulkReceiveRecords: build.mutation({
      query: (body: { ids: string[]; actionTaken?: string; remarks?: string; receiverSignature: string }) => ({
        url: "/records/bulk-receive", method: "PUT", body,
      }),
      invalidatesTags: ["records", "stats"],
    }),
    bulkReleaseRecords: build.mutation({
      query: (body: { ids: string[]; actionTaken?: string; remarks?: string; receiverSignature: string }) => ({
        url: "/records/bulk-release", method: "PUT", body,
      }),
      invalidatesTags: ["records", "stats"],
    }),

    deleteRecord: build.mutation({
      query: (id: string) => ({ url: `/records/${id}`, method: "DELETE" }),
      invalidatesTags: ["records", "stats"],
    }),
    bulkDeleteRecords: build.mutation({
      query: (body: { ids: string[] }) => ({ url: "/records/bulk-delete", method: "DELETE", body }),
      invalidatesTags: ["records", "stats"],
    }),
    archiveRecord: build.mutation({
      query: (id: string) => ({ url: `/records/${id}/archive`, method: "PUT" }),
      invalidatesTags: ["records", "stats"],
    }),
    unarchiveRecord: build.mutation({
      query: (id: string) => ({ url: `/records/${id}/unarchive`, method: "PUT" }),
      invalidatesTags: ["records", "stats"],
    }),
    bulkCreateRecords: build.mutation({
      query: (body: any[]) => ({ url: "/records/bulk", method: "POST", body }),
      invalidatesTags: ["records", "stats"],
    }),

    // ── Comments ──────────────────────────────────────────────────────────
    getComments: build.query({
      query: (recordId: string) => `/records/${recordId}/comments`,
      providesTags: ["comments"],
    }),
    createComment: build.mutation({
      query: ({ recordId, content }: { recordId: string; content: string }) => ({
        url: `/records/${recordId}/comments`, method: "POST", body: { content },
      }),
      invalidatesTags: ["comments"],
    }),
    deleteComment: build.mutation({
      query: ({ recordId, commentId }: { recordId: string; commentId: string }) => ({
        url: `/records/${recordId}/comments/${commentId}`, method: "DELETE",
      }),
      invalidatesTags: ["comments"],
    }),

    // ── Activity Logs ─────────────────────────────────────────────────────
    getActivityLogs: build.query({
      query: (params) => ({ url: "/activity-logs", params }),
      providesTags: ["activityLogs"],
    }),
    clearActivityLogs: build.mutation<void, void>({
      query: () => ({ url: "/activity-logs", method: "DELETE" }),
      invalidatesTags: ["activityLogs"],
    }),

    // ── Notifications (polls activity-logs, last 15, every 30s) ──────────
    getNotifications: build.query({
      query: () => ({ url: "/activity-logs", params: { limit: 15, page: 1 } }),
      providesTags: ["activityLogs"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterAdminMutation,
  useGetAdminsQuery,
  useDeleteAdminMutation,
  useChangePasswordMutation,
  useChangeEmailMutation,
  useChangeUsernameMutation,
  useTrackRecordQuery,
  useGetRecordsQuery,
  useGetSingleRecordQuery,
  useGetRecordStatsQuery,
  useCreateRecordMutation,
  useUpdateRecordMutation,
  useReceiveRecordMutation,
  useReleaseRecordMutation,
  useBulkReceiveRecordsMutation,
  useBulkReleaseRecordsMutation,
  useDeleteRecordMutation,
  useBulkDeleteRecordsMutation,
  useArchiveRecordMutation,
  useUnarchiveRecordMutation,
  useBulkCreateRecordsMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useGetActivityLogsQuery,
  useClearActivityLogsMutation,
  useGetNotificationsQuery,
} = api;