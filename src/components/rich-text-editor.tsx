"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Link2, List, ListOrdered, Redo2, Strikethrough, Underline as UnderlineIcon, Undo2 } from "lucide-react";
import { useEffect } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  label: string;
  minHeight?: number;
};

export function RichTextEditor({ value, onChange, label, minHeight = 260 }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "<p></p>",
    editorProps: { attributes: { class: "rich-editor-content", "aria-label": label } },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return <div className="editor-loading">Uruchamianie edytora…</div>;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Adres odnośnika", previousUrl ?? "https://");
    if (url === null) return;
    if (!url.trim()) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const tools = [
    { label: "Pogrubienie", icon: Bold, active: editor.isActive("bold"), action: () => editor.chain().focus().toggleBold().run() },
    { label: "Kursywa", icon: Italic, active: editor.isActive("italic"), action: () => editor.chain().focus().toggleItalic().run() },
    { label: "Podkreślenie", icon: UnderlineIcon, active: editor.isActive("underline"), action: () => editor.chain().focus().toggleUnderline().run() },
    { label: "Przekreślenie", icon: Strikethrough, active: editor.isActive("strike"), action: () => editor.chain().focus().toggleStrike().run() },
    { label: "Lista punktowana", icon: List, active: editor.isActive("bulletList"), action: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Lista numerowana", icon: ListOrdered, active: editor.isActive("orderedList"), action: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Wyrównaj do lewej", icon: AlignLeft, active: editor.isActive({ textAlign: "left" }), action: () => editor.chain().focus().setTextAlign("left").run() },
    { label: "Wyśrodkuj", icon: AlignCenter, active: editor.isActive({ textAlign: "center" }), action: () => editor.chain().focus().setTextAlign("center").run() },
    { label: "Wyrównaj do prawej", icon: AlignRight, active: editor.isActive({ textAlign: "right" }), action: () => editor.chain().focus().setTextAlign("right").run() },
    { label: "Dodaj odnośnik", icon: Link2, active: editor.isActive("link"), action: setLink },
  ];

  return <div className="rich-editor" style={{ "--editor-min-height": `${minHeight}px` } as React.CSSProperties}>
    <div className="editor-toolbar" role="toolbar" aria-label={`Formatowanie: ${label}`}>
      <select aria-label="Styl tekstu" value={editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p"} onChange={(event) => {
        const type = event.target.value;
        if (type === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
        else if (type === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
        else editor.chain().focus().setParagraph().run();
      }}><option value="p">Akapit</option><option value="h2">Nagłówek</option><option value="h3">Śródtytuł</option></select>
      <span className="toolbar-divider" />
      {tools.map(({ label: toolLabel, icon: Icon, active, action }) => <button key={toolLabel} type="button" className={active ? "active" : ""} aria-label={toolLabel} title={toolLabel} onClick={action}><Icon size={16} /></button>)}
      <span className="toolbar-divider" />
      <button type="button" aria-label="Cofnij" title="Cofnij" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></button>
      <button type="button" aria-label="Ponów" title="Ponów" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></button>
    </div>
    <EditorContent editor={editor} />
  </div>;
}
