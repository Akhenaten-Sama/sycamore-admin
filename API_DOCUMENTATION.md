# Sycamore Admin API Documentation

## Members API (`/api/members`)
- **GET**: List members. Supports search by name/email, filter by team, and first-timer status.
  - Query params: `search`, `teamId`, `isFirstTimer`
- **POST**: Create a new member.
  - Required fields: `firstName`, `lastName`, `email`

---

## Teams API (`/api/teams`)
- **GET**: List teams. Supports search by name/description.
  - Query param: `search`
- **POST**: Create a new team.
  - Required fields: `name`, `description`, `teamLeadId`
  - Optional: `members` (array of member IDs)

---

## Blog API (`/api/blog`)
- **GET**: List blog posts. Supports search and draft filter.
  - Query params: `search`, `isDraft`
- **POST**: Create a new blog post.
  - Required fields: `title`, `content`, `excerpt`, `author`

---

## Events API (`/api/events`)
- **GET**: List events. Supports search and upcoming filter.
  - Query params: `search`, `upcoming`
- **POST**: Create a new event.
  - Required fields: `name`, `date`

---

## Anniversaries API (`/api/anniversaries`)
- **GET**: List anniversaries. Supports type and upcoming filter.
  - Query params: `type`, `upcoming`
- **POST**: Create a new anniversary.
  - Required fields: (see model)

---

## Attendance API (`/api/attendance`)
- **GET**: List attendance records. Supports filtering by member, event, date, and status.
  - Query params: `memberId`, `eventId`, `date`, `status`
- **POST**: Create a new attendance record.
  - Required fields: (see model)

---

All endpoints return JSON with `{ success, data, total }` on success, and `{ success: false, error }` on failure.

For details on request/response formats, see the code or ask for specifics.
