# Common Reusable Components

This directory contains reusable UI components with consistent styling and proper text colors. **Use these instead of raw Dialog components** to ensure consistency across the application.

## Why Use These Components?

- ✅ **Consistent styling** - All text colors, spacing, and layout are pre-configured
- ✅ **Readable text** - No more transparent or unreadable modal headers
- ✅ **DRY principle** - Write less code, fix bugs once
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Accessible** - Built with accessibility in mind

## Components

### 1. Modal

Basic modal wrapper with proper text colors.

```tsx
import { Modal } from '@/components/common'

<Modal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Modal Title"
  description="Optional description"
  size="lg" // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton={true}
  footer={
    <>
      <Button onClick={handleSave}>Save</Button>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
    </>
  }
>
  <div>Your content here</div>
</Modal>
```

### 2. ViewModal

Pre-configured modal for viewing/displaying data in a clean format.

```tsx
import { ViewModal } from '@/components/common'

<ViewModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="View Details"
  size="lg"
  data={[
    { label: 'Name', value: 'John Doe' },
    { label: 'Email', value: 'john@example.com' },
    { 
      label: 'Description', 
      value: <p>Long description...</p>,
      fullWidth: true // Takes full row width
    }
  ]}
/>
```

### 3. FormModal

Pre-configured modal for add/edit forms with automatic field rendering.

```tsx
import { FormModal } from '@/components/common'

const [formData, setFormData] = useState({ name: '', email: '' })

<FormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Add User"
  description="Create a new user"
  size="md"
  loading={saving}
  saveText="Create"
  onSave={handleSave}
  fields={[
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter name',
      required: true,
      value: formData.name,
      onChange: (val) => setFormData(prev => ({ ...prev, name: val })),
      fullWidth: true
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter email',
      required: true,
      value: formData.email,
      onChange: (val) => setFormData(prev => ({ ...prev, email: val }))
    },
    {
      name: 'bio',
      label: 'Biography',
      type: 'textarea',
      rows: 4,
      value: formData.bio,
      onChange: (val) => setFormData(prev => ({ ...prev, bio: val })),
      fullWidth: true
    }
  ]}
/>
```

### 4. ConfirmModal

Pre-configured confirmation modal for delete/destructive actions.

```tsx
import { ConfirmModal } from '@/components/common'

<ConfirmModal
  open={isDeleteOpen}
  onOpenChange={setIsDeleteOpen}
  title="Delete Item"
  description="Are you sure you want to delete this item? This action cannot be undone."
  variant="danger" // 'danger' | 'warning' | 'default'
  confirmText="Delete"
  cancelText="Cancel"
  loading={deleting}
  onConfirm={handleDelete}
/>
```

## Field Types (FormModal)

FormModal supports these field types:

- `text` - Standard text input
- `email` - Email input with validation
- `number` - Number input (supports `min` and `max`)
- `date` - Date picker
- `textarea` - Multi-line text (supports `rows`)
- `select` - Dropdown (provide `options` array)
- `custom` - Custom render function (`customRender`)

## Migration Guide

### Before (Old way - inconsistent):

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle> {/* Text might be unreadable */}
    </DialogHeader>
    <div>
      <Label>Field</Label> {/* Need to add text-gray-900 manually */}
      <Input value={val} onChange={...} />
    </div>
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### After (New way - consistent):

```tsx
<FormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Title" // Automatically readable
  onSave={handleSave}
  fields={[
    {
      name: 'field',
      label: 'Field', // Automatically readable
      value: val,
      onChange: setVal
    }
  ]}
/>
```

## Benefits

1. **Fix once, benefit everywhere** - Update Modal.tsx and all pages get the fix
2. **Less boilerplate** - No need to repeat DialogHeader, DialogTitle, etc.
3. **Consistent UX** - All modals look and behave the same
4. **Type safety** - Catch errors at compile time
5. **Easier testing** - Test one component instead of many implementations

## Best Practices

1. **Always use these components** instead of raw Dialog components
2. **Use ViewModal** for read-only data display
3. **Use FormModal** for forms (add/edit)
4. **Use ConfirmModal** for destructive actions
5. **Use base Modal** only for custom/complex layouts
