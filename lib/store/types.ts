import type {
  AppData,
  Deal,
  DealEvent,
  DealStatus,
  EventComment,
  EventPriority,
  EventStatus,
  Profile,
  UserRole,
} from "@/types"

export interface CreateEventInput {
  dealId: string
  description: string
  priority: EventPriority
  createdBy: string
  assignedTo: string
}

export interface CreateDealInput {
  name: string
  createdBy: string
  assignedTo: string
}

export interface CreateUserInput {
  name: string
  email: string
  role: UserRole
  password?: string
}

export interface AppStoreValue {
  hydrated: boolean
  data: AppData
  createDeal: (input: CreateDealInput) => Deal | Promise<Deal>
  updateDealStatus: (dealId: string, status: DealStatus) => void | Promise<void>
  setDealAssignee: (dealId: string, assignedTo: string) => void | Promise<void>
  createEvent: (input: CreateEventInput) => DealEvent | Promise<DealEvent>
  setEventStatus: (
    eventId: string,
    status: Extract<EventStatus, "closed" | "na">,
    doneBy: string
  ) => void | Promise<void>
  setEventAssignee: (eventId: string, assignedTo: string) => void | Promise<void>
  addComment: (
    eventId: string,
    authorId: string,
    comment: string
  ) => EventComment | Promise<EventComment>
  createUser: (input: CreateUserInput) => Profile | Promise<Profile>
  updateUserRole: (userId: string, role: UserRole) => void | Promise<void>
  setUserActive: (userId: string, isActive: boolean) => void | Promise<void>
}
