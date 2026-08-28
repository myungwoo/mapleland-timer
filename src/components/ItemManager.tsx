'use client';

import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Button, { IconButton } from './ui/Button';
import NumericInput from './ui/NumericInput';

export interface Item {
  id: string;
  name: string;
  startCount: string;
  endCount: string;
  price: string;
}

interface ItemManagerProps {
  title: string;
  items: Item[];
  onItemsChange: (items: Item[]) => void;
}

const CELL = 'field field-sunken h-9 px-2.5 py-0 text-sm';

export default function ItemManager({ title, items, onItemsChange }: ItemManagerProps) {
  const addNewItem = () => {
    const newItem: Item = {
      id: Date.now().toString(),
      name: '',
      startCount: '',
      endCount: '',
      price: ''
    };
    onItemsChange([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof Item, value: string) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onItemsChange(updatedItems);
  };

  const removeItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    onItemsChange(updatedItems);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    onItemsChange(reorderedItems);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <Button size="sm" variant="neutral" onClick={addNewItem}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          아이템 추가
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-xs text-subtle">
          물약처럼 소모하거나 얻은 장비/기타 아이템을 추가하면 순수익에 반영됩니다.
        </p>
      ) : (
        <>
          {/* 넓은 화면에서만 머리글을 보여 준다. 좁은 화면은 아래에서 칸마다 라벨을 단다. */}
          <div className="hidden gap-2 px-1 text-[11px] font-medium text-subtle sm:grid sm:grid-cols-[1.6fr_repeat(3,1fr)_2.25rem]">
            <span className="pl-6">이름</span>
            <span>시작 개수</span>
            <span>종료 개수</span>
            <span>개당 가격</span>
            <span className="sr-only">삭제</span>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="items">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`relative rounded-xl border p-2 transition-shadow sm:grid sm:items-center sm:gap-2
                            sm:border-transparent sm:p-0 sm:grid-cols-[1.6fr_repeat(3,1fr)_2.25rem]
                            ${
                              snapshot.isDragging
                                ? 'border-accent/40 bg-surface shadow-lifted sm:border-accent/40 sm:bg-surface sm:p-2'
                                : 'border-border bg-surface-sunken sm:bg-transparent'
                            }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              {...dragProvided.dragHandleProps}
                              aria-label="순서 변경"
                              title="끌어서 순서 변경"
                              className="flex h-8 w-5 shrink-0 cursor-grab items-center justify-center
                                text-subtle transition-colors hover:text-text active:cursor-grabbing"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <circle cx="9" cy="6" r="1.4" />
                                <circle cx="15" cy="6" r="1.4" />
                                <circle cx="9" cy="12" r="1.4" />
                                <circle cx="15" cy="12" r="1.4" />
                                <circle cx="9" cy="18" r="1.4" />
                                <circle cx="15" cy="18" r="1.4" />
                              </svg>
                            </span>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              placeholder="아이템 이름"
                              aria-label="아이템 이름"
                              className={CELL}
                            />
                          </div>

                          <div className="mt-2 grid grid-cols-3 gap-2 sm:contents">
                            <label className="sm:contents">
                              <span className="mb-1 block text-[11px] text-subtle sm:hidden">시작</span>
                              <NumericInput
                                value={item.startCount}
                                onValueChange={(next) => updateItem(item.id, 'startCount', next)}
                                placeholder="0"
                                aria-label="시작 개수"
                                className={`${CELL} font-mono`}
                              />
                            </label>
                            <label className="sm:contents">
                              <span className="mb-1 block text-[11px] text-subtle sm:hidden">종료</span>
                              <NumericInput
                                value={item.endCount}
                                onValueChange={(next) => updateItem(item.id, 'endCount', next)}
                                placeholder="0"
                                aria-label="종료 개수"
                                className={`${CELL} font-mono`}
                              />
                            </label>
                            <label className="sm:contents">
                              <span className="mb-1 block text-[11px] text-subtle sm:hidden">개당 가격</span>
                              <NumericInput
                                value={item.price}
                                onValueChange={(next) => updateItem(item.id, 'price', next)}
                                placeholder="0"
                                aria-label="개당 가격"
                                className={`${CELL} font-mono`}
                              />
                            </label>
                          </div>

                          <IconButton
                            label="아이템 삭제"
                            tone="danger"
                            onClick={() => removeItem(item.id)}
                            className="absolute right-2 top-2 h-8 w-8 sm:static sm:h-9 sm:w-9"
                          >
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </IconButton>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}
    </div>
  );
}
