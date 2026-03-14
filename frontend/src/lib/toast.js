import { toast } from 'sonner'

export const notify = {
  success(message, options) {
    return toast.success(message, options)
  },
  error(message, options) {
    return toast.error(message, options)
  },
  info(message, options) {
    return toast.info(message, options)
  },
  warning(message, options) {
    return toast.warning(message, options)
  },
  loading(message, options) {
    return toast.loading(message, options)
  },
  promise(promise, messages) {
    return toast.promise(promise, messages)
  },
  dismiss(id) {
    toast.dismiss(id)
  },
}
