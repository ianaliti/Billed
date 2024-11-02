/**
 * @jest-environment jsdom
 */

import mockStore from "../../__mocks__/store.js";

jest.mock("../../app/store", () => {
  return {
    __esModule: true,
    default: mockStore
  }
})

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../../views/BillsUI.js";
import Bills from "../../containers/Bills.js";
import { bills } from "../../fixtures/bills.js"
import { ROUTES_PATH } from "../../constants/routes.js";
import { localStorageMock } from "../../__mocks__/localStorage.js";
import router from "../../app/Router.js";
import { ROUTES } from "../../constants/routes.js";

// Mock jquery and bootstrap modal
global.$ = jest.fn(() => ({
  width: jest.fn(() => 100),
  find: jest.fn(() => ({
    html: jest.fn(),
  })),
  modal: jest.fn(),
  click: jest.fn(),
}));

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
  });

  describe("When I am on Bills Page", () => {

    describe("When page is loaded", () => {
      test("Then bill icon in vertical layout should be highlighted", async () => {
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        window.onNavigate(ROUTES_PATH.Bills);
        await waitFor(() => screen.getByTestId("icon-window"));
        const windowIcon = screen.getByTestId("icon-window");
        expect(windowIcon.classList.contains("active-icon")).toBe(true);
      });
    })

    describe("When page is loading", () => {
      test("Then, Loading page should be rendered", () => {
        const html = BillsUI({ loading: true })
        document.body.innerHTML = html
        expect(screen.getAllByText('Loading...')).toBeTruthy()
      })
    })

    describe("When an error occurs", () => {
      test("Then, Error page should be rendered", () => {
        const html = BillsUI({ error: 'Some error message' })
        document.body.innerHTML = html
        expect(screen.getAllByText('Erreur')).toBeTruthy()
      })
    })
    
    describe("When bills are displayed", () => {
      test("Then bills should be ordered from earliest to latest", () => {
        document.body.innerHTML = BillsUI({ data: bills });
  
        // Select all date elements by their test ID           
        const dateElements = screen.getAllByTestId("bill-date");
  
        // Extract the innerText of each date element       
        const dates = dateElements.map((el) => el.innerHTML);
  
        // Parse the displayed dates into Date objects for comparison       
        const parsedDates = dates.map((date) => new Date(date));
  
        // Create a sorted version of the parsed dates (from earliest to latest)       
        const sortedDates = [...parsedDates].sort((a, b) => a - b);
  
        // Check if the parsed dates match the sorted version       
        expect(parsedDates).toEqual(sortedDates);
      });
    })

    test("Then the newBill button and eye icons should have event listeners", () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const billsClass = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      // Mock the event listener functions
      const handleClickNewBill = jest.fn(billsClass.handleClickNewBill);
      const handleClickIconEye = jest.fn(billsClass.handleClickIconEye);

      // Get the button and eye icons
      const newBillBtn = screen.getByTestId("btn-new-bill");
      const iconEyes = screen.getAllByTestId("icon-eye");

      // Add event listeners
      newBillBtn.addEventListener("click", handleClickNewBill);
      iconEyes.forEach((icon) => {
        icon.addEventListener("click", () => handleClickIconEye(icon));
      });

      // Simulate clicks
      fireEvent.click(newBillBtn);
      fireEvent.click(iconEyes[0]);

      // Check if event listeners were called
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(handleClickIconEye).toHaveBeenCalled();
    });
  });

  describe("When I navigate to Bills page", () => {
    test("Then getBills method should fetch bills from mock API", async () => {
      const billsClass = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });

      const getSpy = jest.spyOn(mockStore, "bills");
      const fetchedBills = await billsClass.getBills();

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(fetchedBills.length).toBe(4); // Adjust based on your mocked data
    });

    test("Then getBills method should handle API error", async () => {
      const errorStore = {
        bills: () => ({
          list: () => Promise.reject(new Error("API Error")),
        }),
      };
      const billsClass = new Bills({
        document,
        onNavigate: jest.fn(),
        store: errorStore,
        localStorage: window.localStorage,
      });

      await expect(billsClass.getBills()).rejects.toThrow("API Error");
    });
  });

  // Test error and loading states
  describe("When an error occurs on API", () => {
    test("Then it should display error page", () => {
      document.body.innerHTML = BillsUI({ error: "An error occurred" });
      expect(screen.getByText(/Erreur/)).toBeTruthy();
    });
  });

  describe("When loading", () => {
    test("Then it should display loading page", () => {
      document.body.innerHTML = BillsUI({ loading: true });
      expect(screen.getByText(/Loading/)).toBeTruthy();
    });
  });
});

// Integration test for GET Bills
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      // Set up user as Employee
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );

      // Create the root div
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      // Initialize router and navigate to Bills page
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      // Wait for bills to load and check content
      await waitFor(() => screen.getByText("Mes notes de frais"));

      // Verify that bills are displayed (using test IDs from your UI)
      const billsTableRows = await screen.getAllByTestId("bill-date");
      expect(billsTableRows.length).toBe(4); // Adjust based on your mocked data

      // Verify that new bill button is present
      expect(screen.getByTestId("btn-new-bill")).toBeTruthy();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
