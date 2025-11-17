

type BottomNavProps = {
  activeTab: 'feed' | 'explore' | 'post' | 'lists' | 'profile';
  onTabChange: (tab: BottomNavProps['activeTab']) => void;
};

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div>
      {/* example */}
      <button onClick={() => onTabChange('feed')}>
        Feed {activeTab === 'feed' && '(active)'}
      </button>
    </div>
  );
}