// Saves options to chrome.storage
const saveOptions = () => {
    const floating_search = document.getElementById('floating_search').checked;
    const auto_select_lite_plan = document.getElementById('auto_select_lite_plan').checked;
    const highlight_auctions = document.getElementById('highlight_auctions').checked;
    const auto_select_on_sale = document.getElementById('auto_select_on_sale').checked;
    const dark_mode = document.getElementById('dark_mode').checked;
  
    chrome.storage.sync.set(
      { floating_search, auto_select_lite_plan, highlight_auctions, auto_select_on_sale, dark_mode },
      () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
          status.textContent = '';
        }, 750);
      }
    );
  };
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  const restoreOptions = () => {
    chrome.storage.sync.get(
      { floating_search: true, auto_select_lite_plan: true, highlight_auctions: true, auto_select_on_sale: true, dark_mode: false },
      (items) => {
        document.getElementById('floating_search').checked = items.floating_search;
        document.getElementById('auto_select_lite_plan').checked = items.auto_select_lite_plan;
        document.getElementById('highlight_auctions').checked = items.highlight_auctions;
        document.getElementById('auto_select_on_sale').checked = items.auto_select_on_sale;
        document.getElementById('dark_mode').checked = items.dark_mode;
      }
    );
  };
  
  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('save').addEventListener('click', saveOptions);