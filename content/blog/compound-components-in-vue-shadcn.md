---
author: Alexander Opalic
pubDatetime: 2026-04-29T00:00:00Z
title: "Compound Components in Vue: Read Reka UI's Dialog and Build Your Own Library On Top"
slug: compound-components-in-vue-shadcn
description: "Every project ships a Dialog component crammed with v-ifs that nobody wants to touch. Read Reka UI's Dialog source to learn the compound pattern, then see how shadcn-vue and Nuxt UI build their libraries on top of it."
tags: ["vue", "design-patterns", "architecture", "reka-ui"]
draft: true
---

## Table of Contents

## TLDR

Every Vue codebase eventually grows a `<Dialog>` that reads like a flowchart: `v-if="showHeader"`, `v-if="showCloseButton"`, `v-if="primaryLabel"`, `v-if="secondaryLabel"`. A designer asks for tighter footer margins on the destructive variant and you grep through twelve call sites. Reka UI's compound component pattern fixes this: ship N small components that share state through a provider, and let the consumer assemble the tree. This post reads Reka UI's actual Dialog source, explains the `createContext` and `Primitive` machinery they ship, then shows how shadcn-vue (thin wrapper, still compound) and Nuxt UI (collapsed `<UModal>` with slot escape hatches) build their libraries on top of those primitives in opposite directions.

This post grew out of Fernando Rojo's talk [Composition Is All You Need](https://www.youtube.com/watch?v=4KvbVq3Eg5w&t=1194s). Watch it first if you have 30 minutes; the rest of this post is the Vue translation, with Reka UI source.

## See It Before You Read About It

Pick a preset. Toggle the children. Watch the UI on the left and the template on the right move together.

That is the whole pattern. One root component, a handful of small children, and the *tree itself* decides what renders, not a stack of boolean props.

## The Dialog You've Already Written Three Times

Almost every codebase I've worked in has the same `<Dialog>` component, and it usually looks something like this:

```vue
<!-- The monolith every team ends up with -->
<Dialog
  :open="open"
  title="Delete project"
  description="This action cannot be undone."
  :show-close-button="true"
  :show-header="true"
  :show-footer="true"
  primary-label="Delete"
  primary-variant="destructive"
  secondary-label="Cancel"
  :show-secondary="true"
  :loading="isDeleting"
  size="md"
  footer-align="end"
  :footer-class="['mt-6']"
  @primary="onDelete"
  @secondary="onClose"
  @close="onClose"
/>
```

The internals are predictably worse:

```vue
<!-- Dialog.vue, somewhere inside -->
<template>
  <Teleport to="body">
    <div v-if="open" class="overlay" @click="onClose">
      <div class="dialog" :class="sizeClass" @click.stop>
        <header v-if="showHeader" class="header">
          <h2 v-if="title">{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
          <button v-if="showCloseButton" @click="onClose">×</button>
        </header>
        <slot />
        <footer v-if="showFooter" :class="['footer', footerClass, alignClass]">
          <Button v-if="showSecondary" variant="ghost" @click="$emit('secondary')">
            {{ secondaryLabel }}
          </Button>
          <Button :variant="primaryVariant" :loading="loading" @click="$emit('primary')">
            {{ primaryLabel }}
          </Button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>
```

It works. Until it doesn't.

A designer asks: "Can the destructive confirm dialogs have a checkbox above the buttons that says *I understand this is permanent*?" Now the footer needs a different inner layout, only for one variant. You add `confirmCheckboxLabel` and `:show-confirm-checkbox` and `@confirm-check`. Three weeks later, somebody wants a "save and continue" dialog with a third button. You add `tertiaryLabel`, `tertiaryVariant`, `@tertiary`. The component is now an options bag with twenty-six props and the team is afraid of it.

Then comes the worst kind of ticket: *change the footer margin from `mt-6` to `mt-4`*. Half your call sites pass a custom `footerClass`. The other half rely on the default. You grep, you eyeball, you ship a regression in the quiet variant nobody remembered.

The root cause is the same one Fernando Rojo names in his talk:

> "If you have a boolean prop that determines which component tree is getting rendered from the parent, you can kind of imagine me looking over your shoulder and shaking my head."
>
> — Fernando Rojo, *Composition Is All You Need*

When a flag changes *what* renders rather than *how*, lift it into the tree.

## This Idea Isn't New

Boolean prop sprawl is the UI version of a problem that functional and object-oriented design have been chewing over for decades. Whenever a function or class grows mode flags, you see the same smell in plain TypeScript:

```ts
function buildReport(data: ReportData, opts: {
  asPdf?: boolean;
  withCover?: boolean;
  withFooter?: boolean;
  includeCharts?: boolean;
  redactPII?: boolean;
}) {
  // a tangle of if/else branches that nobody wants to touch
}

buildReport(data, { asPdf: true, withCover: true, redactPII: true });
```

The **functional** answer is to drop the flags and compose small unary functions:

```ts
const report = renderPdf(addFooter(addCharts(addCover(redactPII(data)))));
```

The **object-oriented** answer is the Gang of Four line, *favour composition over inheritance*, encoded by patterns like Strategy and Decorator that combine small objects instead of baking the variants into one class hierarchy:

```ts
const report = new Pdf(
  new Footer(new Charts(new Cover(new Redacted(data)))),
).render();
```

Both refactorings throw away the options object and let the *arrangement* express the variant. Compound components apply that mental model to UI: the template tree *is* your `pipe()` call. You hand a component the pieces and let composition do the work that flags used to do.

## The Solution: Compose Trees, Don't Configure Them

The compound component pattern flips the relationship. You ship N small components that share state through a provider, and the consumer assembles only the parts they need:

```vue
<Dialog>
  <DialogTrigger>Delete project</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>This cannot be undone.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose as-child>
        <Button variant="ghost">Cancel</Button>
      </DialogClose>
      <Button variant="destructive" @click="onDelete">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

The destructive variant wants a confirmation checkbox above the buttons? Drop a `` into `DialogFooter`. The "save and continue" dialog needs three buttons? Add a third `<Button>`. No flags, no conditionals inside the component. The tree expresses the variant.

> "Where are the booleans and the special props telling us what to render? They're nowhere to be found. We don't have a monolith — we have shared internals that get reimplemented for each use case."
>
> — Fernando Rojo

This is what Reka UI ships, and it's the foundation every Vue component library worth using is built on.

## Reading Reka UI's Dialog

[Reka UI](https://reka-ui.com/) is the headless primitive layer for Vue that the rest of the ecosystem (shadcn-vue, parts of Nuxt UI, Origin UI for Vue) builds on top of. It is the Vue port of Radix Primitives. Its job is to ship behavior, accessibility, and a compound API with **zero styling**. You bring the look.

The Dialog folder contains around a dozen `.vue` files, each doing one thing:

```
packages/core/src/Dialog/
├── DialogRoot.vue          ← provider, no DOM
├── DialogTrigger.vue       ← the button that opens it
├── DialogPortal.vue        ← Teleport wrapper
├── DialogOverlay.vue       ← the dimmed backdrop
├── DialogContent.vue       ← branches modal vs non-modal
├── DialogContentImpl.vue   ← the actual dialog DOM + focus trap
├── DialogContentModal.vue  ← modal-specific behavior
├── DialogContentNonModal.vue
├── DialogTitle.vue
├── DialogDescription.vue
└── DialogClose.vue
```

There is no `Dialog.vue` that renders everything. The state lives in `DialogRoot`, the DOM is split across the leaves, and consumers pick which leaves to render.

### The provider: DialogRoot

Here is `DialogRoot.vue`, in full, lightly trimmed:

```vue
<script lang="ts">
import type { Ref } from 'vue'
import { createContext } from '@/shared'

export interface DialogRootProps {
  open?: boolean
  defaultOpen?: boolean
  modal?: boolean
}

export type DialogRootEmits = {
  'update:open': [value: boolean]
}

export interface DialogRootContext {
  open: Readonly<Ref<boolean>>
  modal: Ref<boolean>
  openModal: () => void
  onOpenChange: (value: boolean) => void
  onOpenToggle: () => void
  triggerElement: Ref<HTMLElement | undefined>
  contentElement: Ref<HTMLElement | undefined>
  contentId: string
  titleId: string
  descriptionId: string
}

export const [injectDialogRootContext, provideDialogRootContext]
  = createContext<DialogRootContext>('DialogRoot')
</script>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import { ref, toRefs } from 'vue'

const props = withDefaults(defineProps<DialogRootProps>(), {
  open: undefined,
  defaultOpen: false,
  modal: true,
})
const emit = defineEmits<DialogRootEmits>()

const open = useVModel(props, 'open', emit, {
  defaultValue: props.defaultOpen,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

const triggerElement = ref<HTMLElement>()
const contentElement = ref<HTMLElement>()
const { modal } = toRefs(props)

provideDialogRootContext({
  open,
  modal,
  openModal: () => { open.value = true },
  onOpenChange: (value) => { open.value = value },
  onOpenToggle: () => { open.value = !open.value },
  contentId: '',
  titleId: '',
  descriptionId: '',
  triggerElement,
  contentElement,
})
</script>

<template>
  <slot
    :open="open"
    :close="() => open = false"
  />
</template>
```

A few things to notice. The component renders no DOM of its own — the template is a single `<slot />`. Its only job is to set up state (`open`), expose handlers (`onOpenChange`, `onOpenToggle`), hold element refs (so the trigger and content can find each other for focus management), and publish all of it via `provideDialogRootContext`.

The slot also doubles as a render prop: it exposes `open` and `close` so consumers who *don't* want a separate `<DialogClose>` button can wire up close behavior at the top level if they need to.

### The escape-hatch helper: createContext

That `createContext` helper is the convention every Reka primitive uses, and it's worth seeing in full because it solves the same problem you'd hit rolling your own:

```ts
// packages/core/src/shared/createContext.ts
export function createContext<ContextValue>(
  providerComponentName: string | string[],
  contextName?: string,
) {
  const symbolDescription
    = typeof providerComponentName === 'string' && !contextName
      ? `${providerComponentName}Context`
      : contextName

  const injectionKey: InjectionKey<ContextValue | null> = Symbol(symbolDescription)

  const injectContext = <T extends ContextValue | null | undefined = ContextValue>(
    fallback?: T,
  ): T extends null ? ContextValue | null : ContextValue => {
    const context = inject(injectionKey, fallback)
    if (context) return context
    if (context === null) return context as any

    throw new Error(
      `Injection \`${injectionKey.toString()}\` not found. Component must be used within ${
        Array.isArray(providerComponentName)
          ? `one of the following components: ${providerComponentName.join(', ')}`
          : `\`${providerComponentName}\``
      }`,
    )
  }

  const provideContext = (contextValue: ContextValue) => {
    provide(injectionKey, contextValue)
    return contextValue
  }

  return [injectContext, provideContext] as const
}
```

It returns a typed `[inject, provide]` tuple over a private `Symbol`. The provider name is baked into the error message, so a `<DialogTrigger>` mounted outside `<DialogRoot>` throws *"Component must be used within `DialogRoot`"* instead of rendering a silently broken tree. This pattern — typed key, throw on miss, named error — is one of the highest leverage 50 lines you can copy from this repo.

### The leaves: DialogTrigger and DialogClose

The trigger is small. Almost all of it is accessibility:

```vue
<script setup lang="ts">
import { Primitive } from '@/Primitive'
import { useForwardExpose, useId } from '@/shared'
import { injectDialogRootContext } from './DialogRoot.vue'

const props = withDefaults(defineProps<DialogTriggerProps>(), { as: 'button' })
const rootContext = injectDialogRootContext()
const { forwardRef, currentElement } = useForwardExpose()

rootContext.contentId ||= useId(undefined, 'reka-dialog-content')
onMounted(() => {
  rootContext.triggerElement.value = currentElement.value
})
</script>

<template>
  <Primitive
    v-bind="props"
    :ref="forwardRef"
    :type="as === 'button' ? 'button' : undefined"
    aria-haspopup="dialog"
    :aria-expanded="rootContext.open.value || false"
    :aria-controls="rootContext.open.value ? rootContext.contentId : undefined"
    :data-state="rootContext.open.value ? 'open' : 'closed'"
    @click="rootContext.onOpenToggle"
  >
    <slot />
  </Primitive>
</template>
```

It calls `injectDialogRootContext()`, registers itself as the `triggerElement` (so focus can return here on close), wires `@click` to the toggle, and stamps the right ARIA attributes plus a `data-state` hook for CSS.

`DialogClose` is even smaller:

```vue
<script setup lang="ts">
const rootContext = injectDialogRootContext()
const props = withDefaults(defineProps<DialogCloseProps>(), { as: 'button' })
</script>

<template>
  <Primitive
    v-bind="props"
    :type="as === 'button' ? 'button' : undefined"
    @click="rootContext.onOpenChange(false)"
  >
    <slot />
  </Primitive>
</template>
```

This is the whole pattern in one screen: the root owns state, the leaves inject just the slice they need (`onOpenToggle` for the trigger, `onOpenChange(false)` for close), and the `<Primitive>` wrapper handles polymorphism — which is the next thing worth understanding.

### Polymorphism: Primitive and as-child

Look at any leaf above. None of them render a fixed `<button>`. They render `<Primitive as="button">`, which means consumers can replace the rendered element without losing the behavior:

```vue
<!-- Default: DialogTrigger renders its own <button> -->
<DialogTrigger>Open</DialogTrigger>

<!-- as-child: DialogTrigger borrows the consumer's element.
     The toggle handler and ARIA attrs land on the <RouterLink>'s <a>. -->
<DialogTrigger as-child>
  <RouterLink to="/profile">Open profile</RouterLink>
</DialogTrigger>
```

Reka implements this with a tiny `Primitive` component, and a smaller still `Slot` helper:

```ts
// packages/core/src/Primitive/Primitive.ts
export const Primitive = defineComponent({
  name: 'Primitive',
  inheritAttrs: false,
  props: {
    asChild: { type: Boolean, default: false },
    as: { type: [String, Object] as PropType<AsTag | Component>, default: 'div' },
  },
  setup(props, { attrs, slots }) {
    const asTag = props.asChild ? 'template' : props.as
    if (typeof asTag === 'string' && SELF_CLOSING_TAGS.includes(asTag))
      return () => h(asTag, attrs)
    if (asTag !== 'template')
      return () => h(props.as, attrs, { default: slots.default })
    return () => h(Slot, attrs, { default: slots.default })
  },
})
```

When `as-child` is set, `Primitive` renders the special `Slot` component, which clones the first non-comment child VNode and merges the attrs (handlers, ARIA, refs) onto it:

```ts
// packages/core/src/Primitive/Slot.ts
const cloned = cloneVNode(
  { ...firstNonCommentChildren, props: {} },
  mergeProps(attrs, firstNonCommentChildren.props ?? {}),
)
```

The contract that comes out of those forty lines is the contract that makes the whole pattern feel ergonomic: **the primitive owns the behavior, the consumer owns the rendered element.** Three escape hatches show up across the library — compound children for *structure*, `as-child` for the *rendered element*, and (when you wrap them with styling) `cn()` for *classes*. All three are decided at the call site.

### The branching one: DialogContent

`DialogContent` is the only leaf that does conditional rendering, and it's a useful one to read because it shows where conditionals are *actually* welcome — branching internal implementations, not consumer-facing API:

```vue
<template>
  <Presence :present="forceMount || rootContext.open.value">
    <DialogContentModal
      v-if="rootContext.modal.value"
      :ref="forwardRef"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
    >
      <slot />
    </DialogContentModal>
    <DialogContentNonModal
      v-else
      :ref="forwardRef"
      v-bind="{ ...props, ...emitsAsProps, ...$attrs }"
    >
      <slot />
    </DialogContentNonModal>
  </Presence>
</template>
```

The `modal` prop on `DialogRoot` controls focus trapping, scroll locking, and `pointer-events` — fundamentally different *behaviors*, so they get two different implementation files. The consumer never sees that split. From the outside it's still `<DialogContent>`. The `v-if` is internal to the library's implementation, not part of its API.

That distinction is the same one Rojo draws: a flag that changes *how* something behaves can stay; a flag that changes *what* renders should become a new component the consumer can choose to mount or not.

## A Quick Detour: How `provide` and `inject` Work

Reka's whole pattern rides on Vue's [`provide` and `inject`](https://vuejs.org/guide/components/provide-inject.html) API. The model matches React Context: a parent publishes a value under a key, and any descendant in its subtree reads that value without the components in between knowing about it.

The minimum example is two components and four lines:

```vue
<!-- Parent.vue -->
<script setup lang="ts">
import { provide, ref } from "vue";

const count = ref(0);
provide("count", count);
</script>
```

```vue
<!-- Child.vue (anywhere in Parent's subtree) -->
<script setup lang="ts">
import { inject } from "vue";

const count = inject("count");
</script>
```

The Vue docs frame this as the answer to *prop drilling*: passing the same prop through three intermediate components that do not care about it just to reach the one that does. With `provide` / `inject`, the descendant reads from the closest matching provider in the tree, however many components deep it is.

Three properties of the API matter for compound components:

- **Reactivity passes through.** Provide a `ref` and the descendant gets the same `ref`. Updates from the parent rerun the descendant's effects. This is how `<DialogTrigger>`'s `aria-expanded` stays in sync with `<DialogRoot>`'s `open` ref.
- **String keys are untyped.** `inject("count")` returns `unknown`. Vue ships [`InjectionKey<T>`](https://vuejs.org/guide/typescript/composition-api.html#typing-provide-inject), a typed `Symbol`, so the injected type matches the provided type at the call site. Reka's `createContext` uses one under the hood.
- **Missing providers fail without warning by default.** `inject("missing")` returns `undefined`. Reka's `createContext` wraps that to throw a named error instead. That error is the difference between "the dialog doesn't open and I have no idea why" and "DialogTrigger must be used within DialogRoot".

## Building Your Own Primitive in This Style

Reading source is one thing. The pattern only sticks once you've built one. Here's a Slack-style composer (the example from Fernando's talk) in Vue, end to end. You can apply this recipe to anything: an Accordion, a Disclosure, a multi-step form, a menu.

### Step 1: The provider owns state

Start with a composable that defines the shared interface. This is your contract:

```ts
// composables/useComposer.ts
import { inject, provide, type InjectionKey, type Ref } from "vue";

interface ComposerContext {
  text: Ref<string>;
  attachments: Ref<File[]>;
  submit: () => void;
  cancel: () => void;
  isSubmitting: Ref<boolean>;
}

const ComposerKey: InjectionKey<ComposerContext> = Symbol("composer");

export function provideComposer(ctx: ComposerContext) {
  provide(ComposerKey, ctx);
}

export function useComposer(): ComposerContext {
  const ctx = inject(ComposerKey);
  if (!ctx) throw new Error("useComposer must be used inside <Composer>");
  return ctx;
}
```

If you squint, this is `createContext` with the steps written out by hand. Same pattern: typed key, throw on miss, named error.

#### If you use VueUse, there is a helper for this

VueUse ships [`createInjectionState`](https://github.com/vueuse/vueuse/blob/main/packages/shared/createInjectionState/index.ts), a factory that takes a setup function and hands back a `[useProvide, useInject]` pair:

```ts
import { createInjectionState } from "@vueuse/core";
import { ref } from "vue";

const [useProvideComposer, useComposerRaw] = createInjectionState(
  (onSubmit: (text: string, attachments: File[]) => Promise<void>) => {
    const text = ref("");
    const attachments = ref<File[]>([]);
    const isSubmitting = ref(false);

    async function submit() {
      isSubmitting.value = true;
      try {
        await onSubmit(text.value, attachments.value);
        text.value = "";
        attachments.value = [];
      } finally {
        isSubmitting.value = false;
      }
    }

    return { text, attachments, isSubmitting, submit };
  },
);

export { useProvideComposer };

export function useComposer() {
  const ctx = useComposerRaw();
  if (!ctx) throw new Error("useComposer must be used inside <Composer>");
  return ctx;
}
```

Reach for `createInjectionState` once the manual pattern is muscle memory; for one composable the dependency does not pay for itself, but for a project with five or ten compound components, the saved boilerplate adds up. The rest of this section uses the manual version because it shows the raw `provide` / `inject` shape with no library in the way.

### Step 2: The root injects, doesn't render

Like `DialogRoot`, the `Composer.vue` root takes implementation as props (or a slot) and provides it. It renders nothing of its own; it is a logical container:

```vue
<!-- Composer.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { provideComposer } from "@/composables/useComposer";

const props = defineProps<{
  onSubmit: (text: string, attachments: File[]) => Promise<void>;
}>();

const emit = defineEmits<{ cancel: [] }>();

const text = ref("");
const attachments = ref<File[]>([]);
const isSubmitting = ref(false);

async function submit() {
  isSubmitting.value = true;
  try {
    await props.onSubmit(text.value, attachments.value);
    text.value = "";
    attachments.value = [];
  } finally {
    isSubmitting.value = false;
  }
}

function cancel() {
  text.value = "";
  attachments.value = [];
  emit("cancel");
}

provideComposer({ text, attachments, submit, cancel, isSubmitting });
</script>

<template>
  <div class="composer"><slot /></div>
</template>
```

### Step 3: Each child is small and focused

Children only know about the slice of context they need:

```vue
<!-- ComposerInput.vue -->
<script setup lang="ts">
import { useComposer } from "@/composables/useComposer";
const { text, submit } = useComposer();
</script>

<template>
  <textarea
    v-model="text"
    @keydown.enter.meta.prevent="submit"
    placeholder="Message..."
  />
</template>
```

```vue
<!-- ComposerSubmit.vue -->
<script setup lang="ts">
import { useComposer } from "@/composables/useComposer";
const { submit, isSubmitting, text } = useComposer();
</script>

<template>
  <button :disabled="isSubmitting || !text.trim()" @click="submit">
    <slot>Send</slot>
  </button>
</template>
```

```vue
<!-- ComposerDropZone.vue -->
<script setup lang="ts">
import { useComposer } from "@/composables/useComposer";
const { attachments } = useComposer();

function onDrop(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer?.files) {
    attachments.value = [...attachments.value, ...Array.from(e.dataTransfer.files)];
  }
}
</script>

<template>
  <div class="drop-zone" @dragover.prevent @drop="onDrop">
    <slot />
  </div>
</template>
```

### Step 4: Compose distinct variants

Now the same primitives produce every variant. The channel composer:

```vue
<Composer :on-submit="postToChannel">
  <ComposerDropZone>
    <ComposerInput />
    <ComposerFooter>
      <ComposerAttachments />
      <ComposerSubmit>Send to #general</ComposerSubmit>
    </ComposerFooter>
  </ComposerDropZone>
</Composer>
```

Edit message, no attachments, different submit copy:

```vue
<Composer :on-submit="updateMessage" @cancel="closeEditor">
  <ComposerInput />
  <ComposerFooter>
    <ComposerCancel>Cancel</ComposerCancel>
    <ComposerSubmit>Save changes</ComposerSubmit>
  </ComposerFooter>
</Composer>
```

Forward message, where the input is hidden but the submit button lives in a dialog footer outside the visual composer:

```vue
<Composer :on-submit="forward">
  <DialogContent>
    <ForwardDestinationPicker />
    <MessagePreview />
  </DialogContent>
  <DialogFooter>
    <ComposerSubmit>Forward</ComposerSubmit>
  </DialogFooter>
</Composer>
```

The Forward variant is the payoff. The submit button lives outside the composer's visual frame but still talks to its state, because they share the same provider. No prop drilling, no `onFormStateChange` callback, no template ref on the parent.

## State Lives in the Provider, Not the Layout

> "If there's one thing to take away from this talk, it would be this. I've solved so many problems in my React code bases by simply lifting state higher up in the tree."
>
> — Fernando Rojo

The Forward example tucked a `<ComposerSubmit>` inside a dialog footer, three components away from the input it submits. That is *the* feature compound components give you that slots alone cannot. Lifting state into a provider makes every other compound-pattern advantage real, and Rojo is right to lead with it.

Move the submit button between the two boxes below. Both sit inside the same `<Composer>` provider, so the submit button reads the same `text` ref the input writes to, no matter where you put it. Watch the inspector: the provider state persists across the move.

In a slot-based design you would have to do one of these by hand:

- Hoist the input's state up to the parent: boilerplate, repeated per variant
- Pass an `onChange` callback through every layer: prop drilling
- Use a scoped slot to pass state to a child: solves the *direct child* case, then collapses the moment a sibling outside the visual frame needs the same state
- Reach into the composer with a template ref: escape hatch, untyped, brittle

With `provide` / `inject`, none of that exists. A child calls `useComposer()` and the closest matching provider answers, no matter how deep or how spatially distant. **The visual layout and the state graph are decoupled.**

This is what people mean when they say "lift state to the provider." You are lifting it *out of the layout*, not up to the parent, so the same state can be read from any DOM position the consumer wants.

## Building a Component Library On Top of Reka UI

Reka ships behavior with no styling. Once you understand the primitives, you have two reasonable paths to ship a real design system on top — and the Vue ecosystem has a clean example of each.

### Path A: shadcn-vue — wrap thin, stay compound

[shadcn-vue](https://www.shadcn-vue.com/) is the copy-paste design system. You don't `npm install` a `<Dialog>`; you run the CLI and it drops actual `.vue` files into `components/ui/dialog/` in *your* repo. Each one wraps the matching Reka primitive. Here is the entire `Dialog.vue` shadcn-vue gives you:

```vue
<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from "reka-ui"
import { DialogRoot, useForwardPropsEmits } from "reka-ui"

const props = defineProps<DialogRootProps>()
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogRoot
    v-slot="slotProps"
    data-slot="dialog"
    v-bind="forwarded"
  >
    <slot v-bind="slotProps" />
  </DialogRoot>
</template>
```

Eight lines. It forwards every Reka prop with `useForwardPropsEmits`, forwards the render-prop slot, and stamps a `data-slot` for CSS targeting. That's it.

`DialogTitle.vue` adds styling but keeps the same shape:

```vue
<script setup lang="ts">
const props = defineProps<DialogTitleProps & { class?: HTMLAttributes["class"] }>()
const delegatedProps = reactiveOmit(props, "class")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <DialogTitle
    data-slot="dialog-title"
    v-bind="forwardedProps"
    :class="cn('cn-dialog-title cn-font-heading', props.class)"
  >
    <slot />
  </DialogTitle>
</template>
```

`DialogHeader` and `DialogFooter` are the only files that *don't* wrap a Reka component, because Reka doesn't ship them — they're pure layout primitives the design system invents:

```vue
<!-- DialogFooter.vue -->
<template>
  <div
    data-slot="dialog-footer"
    :class="cn('cn-dialog-footer flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', props.class)"
  >
    <slot />
    <DialogClose v-if="showCloseButton" as-child>
      <Button variant="outline">Close</Button>
    </DialogClose>
  </div>
</template>
```

The shadcn-vue API is the same compound API as Reka. The library doesn't collapse it. It adds two things: classes via `cn()`, and a few opinionated layout helpers (`DialogHeader`, `DialogFooter`). Everything else is forwarded.

### Path B: Nuxt UI — collapse to one component, expose slots

[Nuxt UI](https://ui.nuxt.com/) takes the opposite approach. It builds Reka's primitives into a single high-level `<UModal>` component with a flat prop API:

```vue
<UModal
  title="Delete project"
  description="This action cannot be undone."
  :close="{ size: 'sm', color: 'neutral' }"
  :dismissible="false"
>
  <UButton color="error" label="Delete" />
  <template #footer>
    <UButton color="neutral" variant="ghost" label="Cancel" />
    <UButton color="error" label="Delete" />
  </template>
</UModal>
```

If you peek at `Modal.vue` in the Nuxt UI source, it composes the same Reka primitives we read above — `DialogRoot`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose` — into one big template:

```vue
<template>
  <DialogRoot v-slot="{ open, close }" v-bind="rootProps">
    <DefineContentTemplate>
      <DialogContent v-bind="contentProps" v-on="contentEvents">
        <slot name="content" :close="close">
          <div v-if="!!slots.header || title || description || props.close" :class="ui.header(...)">
            <slot name="header" :close="close">
              <DialogTitle v-if="title || !!slots.title" :class="ui.title(...)">
                <slot name="title">{{ title }}</slot>
              </DialogTitle>
              <DialogDescription v-if="description || !!slots.description" :class="ui.description(...)">
                <slot name="description">{{ description }}</slot>
              </DialogDescription>
              <DialogClose v-if="props.close" as-child>
                <UButton :icon="closeIcon" v-bind="..." />
              </DialogClose>
            </slot>
          </div>
          <div v-if="!!slots.body" :class="ui.body(...)">
            <slot name="body" :close="close" />
          </div>
          <div v-if="!!slots.footer" :class="ui.footer(...)">
            <slot name="footer" :close="close" />
          </div>
        </slot>
      </DialogContent>
    </DefineContentTemplate>
    <DialogTrigger v-if="!!slots.default" as-child>
      <slot :open="open" />
    </DialogTrigger>
    <DialogPortal v-bind="portalProps">
      <DialogOverlay v-if="overlay" :class="ui.overlay(...)" />
      <ReuseContentTemplate />
    </DialogPortal>
  </DialogRoot>
</template>
```

Two things stand out. First, this is exactly the kind of `v-if` tangle the compound pattern is supposed to prevent — and Nuxt UI has shipped it on purpose. The trade-off is real: the consumer gets a one-liner for the common case (``), and Nuxt UI takes the maintenance pain inside one file once.

Second, every branch falls back to a named slot (`#header`, `#body`, `#footer`, `#title`, `#description`, `#actions`, `#close`). The collapsed API is the *default*; the slots are escape hatches for when you outgrow it. If you want the destructive-confirmation checkbox above the buttons, you fill in `#footer` and lay it out yourself.

### When to pick which

The two paths optimize for opposite things, and the right answer depends on what kind of library you're building.

**Pick the shadcn-vue shape** when consumers are designers and engineers who want full control of the markup, when the components live *inside* the consumer's repo (so changes to the wrapper are local), and when the design system is opinionated about typography and color but not about layout.

**Pick the Nuxt UI shape** when consumers want batteries-included components for the 80% case, when the library ships as an `npm install` (so versioned upgrades matter), and when most call sites are well-served by props alone. The slot escape hatches are how you stay honest about the long tail.

Either way, you are building on the same foundation Reka gives you: a provider, small focused leaves, `as-child` polymorphism, and a context API that throws when misused.

### The styling glue: `cn()`

Both paths share one tiny utility you'll want to copy regardless: `cn()`. shadcn-vue puts it in `lib/utils.ts`; Nuxt UI uses `tailwind-variants` over it; the implementation is the same four lines:

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`clsx` joins truthy class values into a string. `tailwind-merge` deduplicates conflicting Tailwind utilities so the *last* one wins, so `p-2` followed by `p-4` collapses to `p-4`. Together, whatever the consumer passes overrides whatever the primitive sets, with no specificity wars. Default styling lives in the primitive (first argument). The override lives in `props.class` (last argument). Last-write wins.

#### Watch the merge happen

Toggle classes on either side. The left panel shows what naive concatenation produces: conflicting utilities sit side-by-side, flagged with ⚠. The right panel runs the same input through the real `cn()` (using `clsx` + `tailwind-merge` from npm) and shows which classes survive and which get dropped.

Conflict chips on the left are the ones whose winner depends on stylesheet order; fragile. Strikethrough chips on the right are the ones `tailwind-merge` dropped. Hover any dropped chip to see who beat it. Non-conflicting classes (like `text-white` when no other text-color is set) flow through untouched on both sides, since `cn()` deduplicates only when there is a real conflict.

This is what makes the compound API survive in production. Without `cn()`, every wrapper either over-styles (and consumers fork it) or under-styles (and every call site re-specifies the basics). With it, the primitive provides a sensible default that any caller can override one class at a time.

## How to Apply This in Your Codebase

I use this workflow to migrate an existing prop-heavy component:

1. **Find the smell.** List every boolean prop. For each one, ask: does this prop change *what renders* or *how it renders*? "What" props are composition opportunities. "How" props (variant, size, color) are fine; leave them.
2. **Sketch the tree per variant.** Take three real call sites and write down the JSX/template you wish you could write. The compound API drops out of that exercise.
3. **Check Reka first.** If you're rebuilding a Dialog, Popover, Accordion, Combobox, Tabs, Menubar, or any other primitive that already exists in Reka, *don't reimplement it*. Wrap the Reka primitive and ship your styling on top. You get accessibility, focus management, keyboard nav, and ARIA for free.
4. **For something Reka doesn't have, extract the provider.** Move state and handlers into a composable with a typed `InjectionKey` (or `createContext`-style helper). The consumer-facing interface is the type signature of that context object.
5. **Split the children.** Each child component reads only the slice it needs from `useX()`. Keep them dumb. No business logic in the leaves.
6. **Delete the old props one variant at a time.** You can ship the new API alongside the old monolith and migrate call sites incrementally.

A few rules that have saved me pain:

- **Fail when context is missing.** `useComposer` throws. Otherwise consumers will render broken UI without warning when they forget the root.
- **Do not build a generic primitive before you have three concrete users.** One use case is a component. Two is a coincidence. Three is a pattern worth abstracting.
- **Resist the "convenience prop" temptation.** Once you have the compound API, someone will ask for a `` shortcut. That's exactly Nuxt UI's `<UModal>` — a deliberate, separate, higher-level component built *on top* of the primitives. Build it as a new file, not as flags on the root.

## When Not to Use It

The compound pattern has real costs. Skip it when:

- The component has one shape and you are inventing variants that do not exist.
- Consumers are LLM-generated code or external API users who benefit from a flat, predictable signature. (This is half of why Nuxt UI's `<UModal>` exists.)
- The state is trivial and `provide` / `inject` adds more ceremony than the boolean it replaces.

A `` does not need to be compound. A modal with a form, a footer, and three layouts does.

## Connections

This pattern lives across the ecosystem under different names. The unifying idea, *push the variant decision out of the component and into the call site*, shows up in three traditions worth reading.

**Reka UI** (the headless layer used in this post) is the Vue port of [Radix Primitives](https://www.radix-ui.com/primitives). The [Radix philosophy doc](https://github.com/radix-ui/primitives/blob/main/philosophy.md) is the architecture-in-one-page version: *"primitives ship with zero presentational styles"* and *"components are designed with an open API that provides consumers with direct access to the underlying DOM node."* The whole shadcn-vue and partly the Nuxt UI ecosystem flow from those two lines.

**On the React side**, Kent C. Dodds canonized the modern compound-components-with-context approach in [Compound Components with React Hooks](https://kentcdodds.com/blog/compound-components-with-react-hooks). His framing of the pattern as "an implicit contract between parent and children, eliminating verbose prop passing" is the cleanest single statement of why this beats props. [patterns.dev's Compound Pattern](https://www.patterns.dev/react/compound-pattern/) is the canonical reference for the React variant.

**On the Vue side**, Adam Wathan's [Advanced Vue Component Design](https://adamwathan.me/advanced-vue-component-design/) (2018) was the first widely-shared treatment of compound, slots, and providers as a single toolkit. Michael Thiessen catalogs the per-pattern variants in [12 Design Patterns in Vue](https://michaelnthiessen.com/12-design-patterns-vue), [The 6 Levels of Reusability](https://michaelnthiessen.com/6-levels-of-reusability/), and the small applied exercise [Building a (Totally) Unnecessary If/Else Component](https://michaelnthiessen.com/building-unnecessary-if-else-component). The last one builds an `<If>` pair from scratch using `provide`/`inject`, which is a tighter playground than my Composer if you want to internalize the wiring on a smaller surface.

All three traditions share the same shift, from configuration to composition: stop telling the component what to look like, and start handing it the pieces.

## References

- [Reka UI](https://reka-ui.com/): the headless primitives this post reads
- [Reka UI Dialog source on GitHub](https://github.com/unovue/reka-ui/tree/main/packages/core/src/Dialog): every snippet above lives here
- [shadcn-vue](https://www.shadcn-vue.com/): the copy-paste design system built on Reka, Path A above
- [Nuxt UI](https://ui.nuxt.com/): the batteries-included design system built on Reka, Path B above
- [Radix Primitives](https://www.radix-ui.com/primitives): the React parent of Reka UI; same patterns, different binding
- [Fernando Rojo, Composition Is All You Need](https://www.youtube.com/watch?v=4KvbVq3Eg5w): the talk that prompted this post
- [Kent C. Dodds, Compound Components with React Hooks](https://kentcdodds.com/blog/compound-components-with-react-hooks): canonical React treatment
- [Vue docs: provide / inject](https://vuejs.org/guide/components/provide-inject.html)
- [VueUse: createInjectionState](https://vueuse.org/shared/createInjectionState/): the factory that collapses the manual provider boilerplate
