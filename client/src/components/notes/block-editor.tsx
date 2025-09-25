import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface Block {
  id: string;
  type: 'text' | 'todo' | 'link';
  content?: string;
  items?: { id: string; text: string; completed: boolean }[];
  title?: string;
  url?: string;
}

interface BlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export default function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  const [newTodoText, setNewTodoText] = useState<Record<string, string>>({});

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    const updated = blocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    );
    onChange(updated);
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const currentIndex = blocks.findIndex(block => block.id === blockId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const updated = [...blocks];
    [updated[currentIndex], updated[newIndex]] = [updated[newIndex], updated[currentIndex]];
    onChange(updated);
  };

  const deleteBlock = (blockId: string) => {
    if (blocks.length === 1) return; // Keep at least one block
    const updated = blocks.filter(block => block.id !== blockId);
    onChange(updated);
  };

  const addBlock = (type: 'text' | 'todo' | 'link') => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: type === 'text' ? '' : undefined,
      items: type === 'todo' ? [] : undefined,
      title: type === 'link' ? '' : undefined,
      url: type === 'link' ? '' : undefined,
    };
    onChange([...blocks, newBlock]);
  };

  const addTodoItem = (blockId: string) => {
    const text = newTodoText[blockId]?.trim();
    if (!text) return;

    const block = blocks.find(b => b.id === blockId);
    if (!block || block.type !== 'todo') return;

    const newItem = {
      id: `todo-${Date.now()}`,
      text,
      completed: false,
    };

    updateBlock(blockId, {
      items: [...(block.items || []), newItem],
    });

    setNewTodoText(prev => ({ ...prev, [blockId]: '' }));
  };

  const updateTodoItem = (blockId: string, itemId: string, updates: Partial<{ text: string; completed: boolean }>) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || block.type !== 'todo') return;

    const updatedItems = (block.items || []).map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );

    updateBlock(blockId, { items: updatedItems });
  };

  const deleteTodoItem = (blockId: string, itemId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || block.type !== 'todo') return;

    const updatedItems = (block.items || []).filter(item => item.id !== itemId);
    updateBlock(blockId, { items: updatedItems });
  };

  return (
    <div className="space-y-4" data-testid="block-editor">
      {blocks.map((block, index) => (
        <div key={block.id} className="group relative" data-testid={`block-${block.id}`}>
          {/* Block Controls */}
          <div className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 flex flex-col space-y-1 -ml-10 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => moveBlock(block.id, 'up')}
              disabled={index === 0}
              data-testid={`move-up-${block.id}`}
            >
              <i className="fas fa-chevron-up text-xs"></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => moveBlock(block.id, 'down')}
              disabled={index === blocks.length - 1}
              data-testid={`move-down-${block.id}`}
            >
              <i className="fas fa-chevron-down text-xs"></i>
            </Button>
            {blocks.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteBlock(block.id)}
                data-testid={`delete-${block.id}`}
              >
                <i className="fas fa-trash text-xs text-destructive"></i>
              </Button>
            )}
          </div>

          {/* Block Content */}
          <div className="bg-muted/50 rounded-lg p-4 focus-within:bg-muted transition-colors">
            {block.type === 'text' && (
              <Textarea
                value={block.content || ''}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Start typing..."
                className="w-full bg-transparent border-none resize-none focus:ring-0 p-0"
                rows={3}
                data-testid={`text-content-${block.id}`}
              />
            )}

            {block.type === 'todo' && (
              <div>
                <h4 className="font-medium text-foreground mb-3">To-Do List</h4>
                <div className="space-y-2">
                  {(block.items || []).map((item) => (
                    <div key={item.id} className="flex items-center space-x-3" data-testid={`todo-item-${item.id}`}>
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={(checked) => 
                          updateTodoItem(block.id, item.id, { completed: !!checked })
                        }
                        data-testid={`todo-checkbox-${item.id}`}
                      />
                      <span className={`flex-1 ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {item.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTodoItem(block.id, item.id)}
                        data-testid={`delete-todo-${item.id}`}
                      >
                        <i className="fas fa-trash text-xs text-muted-foreground hover:text-destructive"></i>
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex items-center space-x-3 mt-3">
                    <i className="fas fa-plus text-muted-foreground"></i>
                    <Input
                      value={newTodoText[block.id] || ''}
                      onChange={(e) => setNewTodoText(prev => ({ ...prev, [block.id]: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTodoItem(block.id);
                        }
                      }}
                      placeholder="Add new task..."
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0"
                      data-testid={`add-todo-input-${block.id}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addTodoItem(block.id)}
                      data-testid={`add-todo-button-${block.id}`}
                    >
                      <i className="fas fa-plus text-xs"></i>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {block.type === 'link' && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-link text-accent"></i>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={block.title || ''}
                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      placeholder="Link title"
                      className="font-medium bg-transparent border-none p-0 focus:ring-0"
                      data-testid={`link-title-${block.id}`}
                    />
                    <Input
                      value={block.url || ''}
                      onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                      placeholder="https://example.com"
                      className="text-sm text-accent bg-transparent border-none p-0 focus:ring-0"
                      data-testid={`link-url-${block.id}`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add Block Buttons */}
      <div className="flex items-center justify-center mt-8">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => addBlock('text')}
            data-testid="add-text-block"
          >
            <i className="fas fa-font mr-2"></i>Text
          </Button>
          <Button
            variant="outline"
            onClick={() => addBlock('todo')}
            data-testid="add-todo-block"
          >
            <i className="fas fa-check-square mr-2"></i>To-Do
          </Button>
          <Button
            variant="outline"
            onClick={() => addBlock('link')}
            data-testid="add-link-block"
          >
            <i className="fas fa-link mr-2"></i>Link
          </Button>
        </div>
      </div>
    </div>
  );
}
