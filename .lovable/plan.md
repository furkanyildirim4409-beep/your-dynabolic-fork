
Implement the hotfix in `src/components/chat/ChatInterface.tsx` only; the remaining harsh dividers are clearly coming from this file plus the shared input styling override applied there.

1. Remove the header divider
- Update the header wrapper from:
  `bg-background/95 backdrop-blur-xl border-b border-border p-4 flex items-center gap-4 z-10`
- To a seamless version such as:
  `bg-card/95 backdrop-blur-md p-4 flex items-center gap-4 z-10`
- This removes the visible black separator above the messages while keeping the floating glass look.

2. Keep the message pane borderless
- The message container already has no `border-*` or `divide-y`, so no structural change is needed there.
- Retain the existing absolute layout and bottom anchor; just ensure no new separator classes are introduced.

3. Remove any footer divider feel
- Update the footer/input-area wrapper from:
  `bg-background/95 backdrop-blur-xl p-4 safe-area-inset`
- To:
  `bg-card/95 backdrop-blur-md p-3 safe-area-inset z-10`
- This aligns the footer with the new seamless glass treatment and avoids the stronger background edge that can read like a divider.

4. Neutralize the input’s own border
- The visible line is also reinforced by the shared `Input` base classes (`border border-input bg-background`), and the current chat override still keeps a border via `border-border`.
- Update the chat-specific `<Input />` class from:
  `flex-1 bg-secondary/50 border-border rounded-full px-4`
- To:
  `flex-1 bg-muted/50 border-0 rounded-full px-4 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0`
- This removes the dark outline while preserving a subtle premium focus state.

5. Preserve current behavior
- Do not change the existing portal, auto-scroll anchor, or triple-fire scroll logic.
- Do not modify `src/components/ui/input.tsx` globally, since the request is specifically about making this chat layout seamless and a global input border removal would affect the rest of the app.

Technical notes
- The current file still contains the exact offending header class with `border-b border-border`.
- The footer wrapper is already borderless, but its stronger background plus the bordered `Input` makes a separator still appear visually.
- The message area does not currently use `divide-y`, so the fix is localized to header/footer surface styling and the chat input override.
