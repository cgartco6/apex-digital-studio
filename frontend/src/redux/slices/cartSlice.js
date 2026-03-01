import { createSlice } from '@reduxjs/toolkit';

const loadCartFromStorage = () => {
  try {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : { items: [], totalAmount: 0, totalItems: 0 };
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return { items: [], totalAmount: 0, totalItems: 0 };
  }
};

const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

const calculateTotals = (items) => {
  const totalAmount = items.reduce((total, item) => {
    const price = item.discountPrice || item.price;
    return total + (price * item.quantity);
  }, 0);
  
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  
  return { totalAmount, totalItems };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: loadCartFromStorage(),
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;
      const existingItem = state.items.find(item => item.id === newItem.id);
      
      if (existingItem) {
        existingItem.quantity += newItem.quantity || 1;
      } else {
        state.items.push({
          ...newItem,
          quantity: newItem.quantity || 1
        });
      }
      
      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.totalItems = totals.totalItems;
      
      saveCartToStorage(state);
    },
    
    removeFromCart: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter(item => item.id !== id);
      
      const totals = calculateTotals(state.items);
      state.totalAmount = totals.totalAmount;
      state.totalItems = totals.totalItems;
      
      saveCartToStorage(state);
    },
    
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item) {
        item.quantity = quantity;
        
        const totals = calculateTotals(state.items);
        state.totalAmount = totals.totalAmount;
        state.totalItems = totals.totalItems;
        
        saveCartToStorage(state);
      }
    },
    
    updateDesignSpecs: (state, action) => {
      const { id, designSpecs } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item) {
        item.designSpecs = { ...item.designSpecs, ...designSpecs };
        saveCartToStorage(state);
      }
    },
    
    addAICustomization: (state, action) => {
      const { id, customization } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item) {
        if (!item.aiCustomizations) {
          item.aiCustomizations = [];
        }
        item.aiCustomizations.push(customization);
        saveCartToStorage(state);
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.totalItems = 0;
      saveCartToStorage(state);
    },
    
    loadCart: (state, action) => {
      state.items = action.payload.items || [];
      state.totalAmount = action.payload.totalAmount || 0;
      state.totalItems = action.payload.totalItems || 0;
      saveCartToStorage(state);
    },
    
    applyDiscount: (state, action) => {
      const { code, discount } = action.payload;
      state.discountCode = code;
      state.discount = discount;
      saveCartToStorage(state);
    },
    
    removeDiscount: (state) => {
      state.discountCode = null;
      state.discount = null;
      saveCartToStorage(state);
    },
    
    saveForLater: (state, action) => {
      const id = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item) {
        state.savedItems = state.savedItems || [];
        state.savedItems.push(item);
        state.items = state.items.filter(item => item.id !== id);
        
        const totals = calculateTotals(state.items);
        state.totalAmount = totals.totalAmount;
        state.totalItems = totals.totalItems;
        
        saveCartToStorage(state);
      }
    },
    
    moveToCart: (state, action) => {
      const id = action.payload;
      const item = state.savedItems?.find(item => item.id === id);
      
      if (item && state.savedItems) {
        state.items.push(item);
        state.savedItems = state.savedItems.filter(item => item.id !== id);
        
        const totals = calculateTotals(state.items);
        state.totalAmount = totals.totalAmount;
        state.totalItems = totals.totalItems;
        
        saveCartToStorage(state);
      }
    }
  }
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  updateDesignSpecs,
  addAICustomization,
  clearCart,
  loadCart,
  applyDiscount,
  removeDiscount,
  saveForLater,
  moveToCart
} = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.totalAmount;
export const selectCartItemCount = (state) => state.cart.totalItems;
export const selectSavedItems = (state) => state.cart.savedItems || [];

export default cartSlice.reducer;
