import { TextField } from '@/components/form/TextField'
import { Button } from '@/components/ui/button'
import { useRoomForm } from '@/hooks/useRoomForm'
import { NAME_MAX_LENGTH } from '@/lib/roomValidation'

export function CreateRoomForm() {
  const form = useRoomForm()

  function handleValid() {
    // later on wire this submit to the API
  }

  return (
    <form
      className="grid gap-3"
      noValidate
      onSubmit={form.handleSubmit(handleValid)}
    >
      <TextField
        {...form.getFieldProps('name')}
        name="name"
        label="Room name"
        placeholder="e.g. Bedroom"
        maxLength={NAME_MAX_LENGTH}
        autoComplete="off"
        spellCheck={false}
        required
      />

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <TextField
          {...form.getFieldProps('width')}
          name="width"
          label="Width (cm)"
          placeholder="e.g. 300"
          inputMode="numeric"
          autoComplete="off"
          required
        />
        <TextField
          {...form.getFieldProps('length')}
          name="length"
          label="Length (cm)"
          placeholder="e.g. 400"
          inputMode="numeric"
          autoComplete="off"
          required
        />
      </div>

      {/* Activated even when invalid: validation reveals what needs fixing. */}
      <Button type="submit" className="h-11 w-full px-6 text-[15px] sm:w-auto">
        Create room
      </Button>
    </form>
  )
}
