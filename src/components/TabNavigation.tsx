// Placeholder TabNavigation component (legacy support)
interface TabNavigationProps {
    tabs: { id: string; label: string }[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
    return (
        <div className="flex space-x-2 border-b">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`px-4 py-2 font-medium ${activeTab === tab.id
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
