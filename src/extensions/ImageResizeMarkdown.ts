import ImageResize from 'tiptap-extension-resize-image'

// Extract width from containerStyle CSS string
function extractWidth(containerStyle: string | null | undefined): string | null {
  if (!containerStyle) return null
  const match = containerStyle.match(/width:\s*([0-9.]+(?:px|%))/)
  return match ? match[1] : null
}

// Extend ImageResize to add markdown serialization support
export const ImageResizeMarkdown = ImageResize.extend({
  // Add markdown serializer support for tiptap-markdown
  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const { src, alt, title, containerStyle } = node.attrs
          const width = extractWidth(containerStyle)

          if (width) {
            // Output HTML when width is specified (markdown doesn't support dimensions)
            const titleAttr = title ? ` title="${title}"` : ''
            const altAttr = alt || ''
            state.write(`<img src="${src}" alt="${altAttr}" width="${width}"${titleAttr} />`)
          } else {
            // Standard markdown image
            state.write(`![${alt || ''}](${src}${title ? ` "${title}"` : ''})`)
          }
        },
        parse: {
          // Let the default parser handle HTML img tags
        },
      },
    }
  },
})
