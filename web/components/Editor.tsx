"use client"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

export default function Editor({ content, onChange }: { content: any; onChange: (json: any) => void }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
  })

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={() => editor?.chain().focus().toggleBold().run()}>Bold</button>
        <button onClick={() => editor?.chain().focus().toggleItalic().run()}>Italic</button>
        <button onClick={() => editor?.chain().focus().toggleBulletList().run()}>Bullets</button>
        <button onClick={() => editor?.chain().focus().toggleOrderedList().run()}>Numbers</button>
      </div>
      <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: 8 }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}