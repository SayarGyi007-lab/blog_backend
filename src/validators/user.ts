import {z} from "zod"

export const getUserListParamSchema = z.object({
    page: z.number().min(1).optional(),
    limit: z.number().min(1).optional(),
    search: z.string().optional(),
    searchBy: z.enum(["name"]).optional()
})

export type getUserListParamType = z.infer<typeof getUserListParamSchema>
