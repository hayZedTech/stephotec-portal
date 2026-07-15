# Student Assignment API Quick Reference

## Base URL
`http://localhost:8000/api/v1/learning/`

## Endpoints

### Learning Content
```
POST /student-learning-content/assign_to_students/
{
  "content_id": 1,
  "student_ids": [1, 2, 3]
}

GET /student-learning-content/student_content/?student_id=1
```

### Assignments
```
POST /student-assignments/assign_to_students/
{
  "assignment_id": 1,
  "student_ids": [1, 2, 3]
}

GET /student-assignments/student_assignments/?student_id=1
```

### Certificates
```
POST /student-certificates/assign_to_students/
{
  "certificate_id": 1,
  "student_ids": [1, 2, 3]
}

GET /student-certificates/student_certificates/?student_id=1
```

### Handouts
```
POST /student-handouts/assign_to_students/
{
  "handout_id": 1,
  "student_ids": [1, 2, 3]
}

GET /student-handouts/student_handouts/?student_id=1
```

## Response Format

### Assign Response
```json
{
  "detail": "Content assigned to 3 student(s)"
}
```

### Fetch Response
```json
[
  {
    "id": 1,
    "student": 1,
    "learning_content": 1,
    "learning_content_title": "Introduction to Python",
    "course_name": "Python Basics",
    "assigned_at": "2024-01-15T10:30:00Z",
    "completed_at": null
  }
]
```

## Frontend Service Usage

```javascript
import {
  getStudentLearningContent,
  assignLearningContentToStudents,
  getStudentAssignments,
  assignAssignmentsToStudents,
  getStudentCertificates,
  assignCertificatesToStudents,
  getStudentHandouts,
  assignHandoutsToStudents,
} from "@/services/studentAssignments";

// Fetch assigned content
const content = await getStudentLearningContent(studentId);

// Assign content to students
await assignLearningContentToStudents(contentId, [studentId1, studentId2]);
```

## Permissions
- All endpoints require admin role (`IsAdminUserRole`)
- Only admins can assign content to students
- Only admins can view student assignments
