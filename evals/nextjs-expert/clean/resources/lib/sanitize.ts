import 'server-only'
import DOMPurify from 'isomorphic-dompurify'

export const sanitize = (html: string) => DOMPurify.sanitize(html)
