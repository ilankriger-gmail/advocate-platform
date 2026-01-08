'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useCallback, useState } from 'react';
import { PromptModal } from '@/components/ui';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disableLinks?: boolean;
}

// Barra de ferramentas do editor
function MenuBar({ editor, disableLinks = false }: { editor: Editor | null; disableLinks?: boolean }) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [previousUrl, setPreviousUrl] = useState('');

  const setLink = useCallback(() => {
    if (!editor) return;

    const currentUrl = editor.getAttributes('link').href || '';
    setPreviousUrl(currentUrl);
    setIsLinkModalOpen(true);
  }, [editor]);

  const handleLinkSubmit = useCallback(async (url: string) => {
    if (!editor) return;

    // URL vazia = remover link
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setIsLinkModalOpen(false);
      return;
    }

    // Adicionar https:// se não tiver protocolo
    const finalUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    setIsLinkModalOpen(false);
  }, [editor]);

  const handleModalClose = useCallback(() => {
    setIsLinkModalOpen(false);
    // Restore editor focus after modal closes
    setTimeout(() => {
      editor?.commands.focus();
    }, 100);
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {/* Bold */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
          editor.isActive('bold')
            ? 'bg-purple-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
        }`}
        title="Negrito (Ctrl+B)"
      >
        <strong>B</strong>
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
          editor.isActive('italic')
            ? 'bg-purple-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
        }`}
        title="Itálico (Ctrl+I)"
      >
        <em>I</em>
      </button>

      {/* Strike */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
          editor.isActive('strike')
            ? 'bg-purple-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
        }`}
        title="Riscado"
      >
        <s>S</s>
      </button>

      <div className="w-px bg-gray-300 mx-1" />

      {/* Bullet List */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
          editor.isActive('bulletList')
            ? 'bg-purple-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
        }`}
        title="Lista com marcadores"
      >
        • Lista
      </button>

      {/* Ordered List */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
          editor.isActive('orderedList')
            ? 'bg-purple-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
        }`}
        title="Lista numerada"
      >
        1. Lista
      </button>

      {/* Link - apenas para criadores */}
      {!disableLinks && (
        <>
          <div className="w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={setLink}
            className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
              editor.isActive('link')
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
            title="Adicionar link"
          >
            Link
          </button>

          {/* Unset Link */}
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="px-2 py-1 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
              title="Remover link"
            >
              ✕
            </button>
          )}
        </>
      )}

      <div className="w-px bg-gray-300 mx-1" />

      {/* Undo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="px-2 py-1 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Desfazer (Ctrl+Z)"
      >
        ↩
      </button>

      {/* Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="px-2 py-1 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Refazer (Ctrl+Y)"
      >
        ↪
      </button>
      </div>

      {/* Link Modal */}
      <PromptModal
        isOpen={isLinkModalOpen}
        onClose={handleModalClose}
        onSubmit={handleLinkSubmit}
        title="Adicionar link"
        description="Digite a URL do link. Deixe vazio para remover o link."
        placeholder="https://exemplo.com"
        initialValue={previousUrl}
        submitText="Confirmar"
        cancelText="Cancelar"
      />
    </>
  );
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Escreva seu conteúdo aqui...',
  disabled = false,
  disableLinks = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Desabilitar headings para manter simples
        codeBlock: false, // Desabilitar blocos de código
        blockquote: false, // Desabilitar citações
      }),
      // Link extension apenas para criadores
      ...(disableLinks ? [] : [
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-purple-600 underline hover:text-purple-800',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        }),
      ]),
    ],
    content,
    editable: !disabled,
    immediatelyRender: false, // Evita erro de hydration no SSR
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] p-3',
      },
    },
  });

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${disabled ? 'opacity-60' : ''}`}>
      <MenuBar editor={editor} disableLinks={disableLinks} />
      <div className="bg-white">
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:p-3 [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
}

// Componente para exibir conteúdo HTML sanitizado
export function RichTextDisplay({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm max-w-none [&_a]:text-purple-600 [&_a]:underline [&_a:hover]:text-purple-800"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
