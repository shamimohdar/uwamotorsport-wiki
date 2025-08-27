"use client"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlock from '@tiptap/extension-code-block'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import { useEffect, useRef, useState } from 'react'

interface EditorProps {
  content: any
  onChange: (json: any) => void
  onSave?: () => void
  onCancel?: () => void
  isEditing?: boolean
}

export default function Editor({ content, onChange, onSave, onCancel, isEditing = false }: EditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'bg-gray-100 p-4 rounded font-mono text-sm',
        },
      }),
      HorizontalRule.configure({
        HTMLAttributes: {
          class: 'border-t border-gray-300 my-4',
        },
      }),
    ],
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

  const addLink = () => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run()
      setLinkUrl('')
      setShowLinkInput(false)
    }
  }

  const addImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run()
      setImageUrl('')
      setShowImageInput(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && editor) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (file.type.startsWith('image/')) {
          editor.chain().focus().setImage({ src: result }).run()
        } else {
          // For documents, create a link
          editor.chain().focus().setLink({ href: result, target: '_blank' }).run()
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && editor) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        editor.chain().focus().setImage({ src: result }).run()
      }
      reader.readAsDataURL(file)
    }
  }

  const insertTable = () => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
    }
  }

  const addCodeBlock = () => {
    if (editor) {
      editor.chain().focus().toggleCodeBlock().run()
    }
  }

  const addDivider = () => {
    if (editor) {
      editor.chain().focus().setHorizontalRule().run()
    }
  }

  if (!isEditing) {
    return (
      <div className="prose max-w-none">
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-2 p-3">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('bold') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('italic') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('underline') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Underline"
            >
              <u>U</u>
            </button>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('heading', { level: 1 }) ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Heading 3"
            >
              H3
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('bulletList') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Bullet List"
            >
              • List
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-100 ${editor?.isActive('orderedList') ? 'bg-blue-100 text-blue-700' : ''}`}
              title="Numbered List"
            >
              1. List
            </button>
          </div>

          {/* Insert Options */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            <button
              onClick={() => setShowLinkInput(true)}
              className="p-2 rounded hover:bg-gray-100"
              title="Insert Link"
            >
              🔗
            </button>
            <button
              onClick={() => setShowImageInput(true)}
              className="p-2 rounded hover:bg-gray-100"
              title="Insert Image URL"
            >
              🖼️
            </button>
            <button
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded hover:bg-gray-100"
              title="Upload Image"
            >
              📤
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded hover:bg-gray-100"
              title="Upload File"
            >
              📎
            </button>
            <button
              onClick={insertTable}
              className="p-2 rounded hover:bg-gray-100"
              title="Insert Table"
            >
              📊
            </button>
            <button
              onClick={addCodeBlock}
              className="p-2 rounded hover:bg-gray-100"
              title="Code Block"
            >
              &lt;/&gt;
            </button>
            <button
              onClick={addDivider}
              className="p-2 rounded hover:bg-gray-100"
              title="Horizontal Rule"
            >
              ➖
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Publish
            </button>
          </div>
        </div>

        {/* Link Input */}
        {showLinkInput && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 border-t border-gray-200">
            <input
              type="url"
              placeholder="Enter URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
              onKeyPress={(e) => e.key === 'Enter' && addLink()}
            />
            <button onClick={addLink} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add
            </button>
            <button onClick={() => setShowLinkInput(false)} className="px-3 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
          </div>
        )}

        {/* Image Input */}
        {showImageInput && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 border-t border-gray-200">
            <input
              type="url"
              placeholder="Enter image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded"
              onKeyPress={(e) => e.key === 'Enter' && addImage()}
            />
            <button onClick={addImage} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add
            </button>
            <button onClick={() => setShowImageInput(false)} className="px-3 py-2 text-gray-600 hover:text-gray-800">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.txt,.md"
      />
      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        onChange={handleImageUpload}
        accept="image/*"
      />

      {/* Editor Content */}
      <div className="p-6 min-h-[500px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}