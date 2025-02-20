'use client';

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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <button
          onClick={addNewItem}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          + 아이템 추가
        </button>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="col-span-3">이름</div>
          <div className="col-span-2">시작 개수</div>
          <div className="col-span-2">종료 개수</div>
          <div className="col-span-3">개당 가격</div>
          <div className="col-span-2"></div>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="grid grid-cols-12 gap-2">
            <input
              type="text"
              value={item.name}
              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
              placeholder="아이템 이름"
              className="col-span-3 px-2 py-1 text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            />
            <input
              type="number"
              value={item.startCount}
              onChange={(e) => updateItem(item.id, 'startCount', e.target.value)}
              placeholder="시작 개수"
              className="col-span-2 px-2 py-1 text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            />
            <input
              type="number"
              value={item.endCount}
              onChange={(e) => updateItem(item.id, 'endCount', e.target.value)}
              placeholder="종료 개수"
              className="col-span-2 px-2 py-1 text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            />
            <input
              type="number"
              value={item.price}
              onChange={(e) => updateItem(item.id, 'price', e.target.value)}
              placeholder="개당 가격"
              className="col-span-3 px-2 py-1 text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
            />
            <button
              onClick={() => removeItem(item.id)}
              className="col-span-2 px-2 py-1 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}