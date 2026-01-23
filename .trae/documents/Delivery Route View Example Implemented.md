I have created a comprehensive delivery route example that meets all your requirements.

### Features Implemented:
1.  **Delivery Route View**:
    -   **Three Key Locations**: Current Position (Rider), Pickup Point (Shop), Delivery Point (Customer).
    -   **Two Route Segments**:
        -   **Rider -> Pickup**: Displayed as a **dotted blue line** (indicating the "to pickup" phase).
        -   **Pickup -> Delivery**: Displayed as a **solid green line** (indicating the "to delivery" phase).
2.  **Information Display**:
    -   **Bottom Panel**: Shows the current status ("Heading to Merchant").
    -   **Stats**: Total distance and estimated time.
    -   **Timeline**: A step-by-step view of the journey (Start -> Pickup -> Delivery) with individual segment distances and times.
3.  **Simulation & Robustness**:
    -   Uses **Gaode Web API** for real path planning (`bicycling` mode).
    -   **Mock Data Fallback**: Since the API key is empty, I added a fallback mechanism. If the API call fails, it automatically switches to simulated route data so you can still see the UI and interaction.
4.  **No Navigation**: Purely a view mode as requested.

### Files Created/Modified:
-   `app/(map)/deliveryRouteExample.tsx`: The new example page.
-   `app/(map)/index.tsx`: Added a button "🛵 配送员路线视图(模拟)" to access the new page.

You can now run the app and click the new button to see the delivery route view.