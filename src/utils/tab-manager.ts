export class TabManager {
    constructor() {
        this.initializeTabs();
    }

    private initializeTabs(): void {
        // Tab switching functionality
        document.addEventListener('click', (event: Event) => {
            const target = event.target as HTMLElement;
            if (target && target.classList.contains('tab')) {
                this.switchTab(target.getAttribute('onclick')?.match(/'(.*)'/)?.[1] || '');
            }
        });

        // Add global switchTab function
        (window as any).switchTab = (tabName: string) => this.switchTab(tabName);
    }

    public switchTab(tabName: string): void {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show the selected tab content
        const targetContent = document.getElementById(`${tabName}-tab`);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        // Add active class to the clicked tab
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(tab => {
            const buttonElement = tab as HTMLButtonElement;
            if (buttonElement.textContent?.toLowerCase().includes(tabName)) {
                buttonElement.classList.add('active');
            }
        });
    }
}
