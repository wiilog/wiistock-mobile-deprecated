export enum BarcodeScannerModeEnum {
    ONLY_SCAN,
    ONLY_SCAN_WITH_LABEL_MODE,
    WITH_MANUAL,
    TOOL_SEARCH, // Only with search and scan buttons
    TOOL_SEARCH_AND_LABEL, // With search, selected label, scan buttons
    TOOL_SELECTED_LABEL, // With selected label and scan buttons
    TOOLS_FULL, // With search and creation form
    ONLY_SEARCH, // Only with search button
}
