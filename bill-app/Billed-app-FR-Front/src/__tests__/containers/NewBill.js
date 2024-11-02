/**
 * @jest-environment jsdom
 */

import { waitFor, screen, fireEvent } from "@testing-library/dom"
import NewBillUI from "../../views/NewBillUI.js"
import NewBill from "../../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../../constants/routes.js"
import { localStorageMock } from "../../__mocks__/localStorage.js"
import mockStore from "../../__mocks__/store"


describe("Given I am connected as an employee", () => {
  let newBill;

  beforeEach(() => {
    // Mock window.alert before any tests run
    global.alert = jest.fn();

    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: 'employee@test.com'
    }));
    document.body.innerHTML = NewBillUI();
    const onNavigate = jest.fn();
    newBill = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage
    });
  });

  afterEach(() => {
    // Clean up mocks after each test
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe("When I am on NewBill Page", () => {
    test("Then it should render the new form bill", () => {
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    });
  })

  describe("When I select a file", () => {
    test("Then I should be able to upload a valid file", async () => {

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      const fileInput = screen.getByTestId("file");
      fileInput.addEventListener("change", handleChangeFile)

      const validFile = new File(["file content"], "test.png", { type: "image/png" });
      fireEvent.change(fileInput, {
        target: { files: [validFile] },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("test.png");
    });

    test("Then it should show an error when uploading an invalid file format", async () => {
      global.alert = jest.fn();

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      const fileInput = screen.getByTestId("file");
      fileInput.addEventListener("change", handleChangeFile)
      const invalidFile = new File(["file.pdf"], "test.pdf", { type: "image/pdf" });

      fireEvent.change(fileInput, {
        target: { files: [invalidFile] },
      });

      expect(handleChangeFile).toHaveBeenCalled()
      expect(fileInput.value).toBe('');
      expect(global.alert).toHaveBeenCalledWith("Le fichier doit être une image au format jpg, jpeg ou png");
    });
  });
  
  describe("When I handle file change", () => {
    test("Then it should create a file with correct data", async () => {
      const expectedResponse = {
        fileUrl: 'http://localhost:3456/images/test.jpg',
        key: '1234'
      };

      // Create a mock store with the expected response
      const mockStore = {
        bills: () => ({
          create: jest.fn().mockResolvedValue(expectedResponse)
        })
      };
  
      const newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage
      });
  
      const fileInput = screen.getByTestId("file");
      const file = new File(['file content'], 'test.jpg', { type: 'image/jpeg' });

      // Spy on console.log
      const consoleSpy = jest.spyOn(console, 'error');
  
      // Trigger file change event
      const event = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\test.jpg',
          files: [file]
        }
      };

      await newBill.handleChangeFile(event)
  
      // Assertions
      expect(newBill.billId).toBe(expectedResponse.key);
      expect(newBill.fileUrl).toBe(expectedResponse.fileUrl);
      expect(newBill.fileName).toBe('test.jpg');
      expect(consoleSpy).not.toHaveBeenCalled();

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe("When I fill out the new bill form", () => {
    test("Then a new bill should be created with valid data", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = jest.fn();

      const updateMock = jest.fn(() => Promise.resolve({}))
      mockStore.bills = jest.fn(() => ({
        update: updateMock
      }));

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      // Fill in the form with valid data
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-04-15" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "100" } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Test Comment" } })

      // Submit the form
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        expect(mockStore.bills().update).toHaveBeenCalled();
      });
    });

    test("Then it should handle errors during form submission", async () => {
      const onNavigate = jest.fn();
      console.error = jest.fn();

      mockStore.bills.mockImplementationOnce(() => ({
        update: jest.fn().mockRejectedValue(new Error("Form submission failed"))
      }));

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });

      // Fill in the form with valid data
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-04-15" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "100" } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });

      // Submit the form
      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockStore.bills().update).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(new Error("Form submission failed"));
      });
    });
  })

  describe("When I submit the form with valid data", () => {
    test("Then it should update the bill and navigate to Bills", async () => {
      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);

      // Mock form data
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Test Expense" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-04-15" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "100" } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Test Comment" } });

      // Mock updateBill method
      const mockUpdateBill = jest.fn().mockResolvedValue({});
      newBill.updateBill = mockUpdateBill;

      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      await waitFor(() => {
        expect(mockUpdateBill).toHaveBeenCalled();
        expect(newBill.onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
      });
    })

    test("Then a new bill should be created", async () => {
      const updateMock = jest.fn().mockResolvedValue({});

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: updateMock,
        };
      });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })

      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)

      fireEvent.submit(form)

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled()
        expect(updateMock).toHaveBeenCalled()
      })
    })

    test("Then bill creation should fail on API error", async () => {
      const onNavigate = jest.fn()
      const errorMock = jest.fn().mockRejectedValue(new Error("Erreur 404"))
      const mockStore = {
        bills: jest.fn(() => ({
          update: errorMock
        }))
      }
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener("submit", handleSubmit)

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => { })

      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()

      await waitFor(() => {
        expect(errorMock).toHaveBeenCalled()
        expect(console.error).toHaveBeenCalled()
      })

      // Restore console.error
      console.error.mockRestore()
    })
  })

  describe("When I submit the form to create a new bill", () => {
    test("Then a new bill should be posted to the API and added successfully", async () => {
      // Mock API POST request with a successful response
      const updateMock = jest.fn().mockResolvedValue({ 
        fileUrl: 'http://localhost:3456/images/test.jpg',
        key: '1234',
      });
  
      // Setting up mockStore to use the createMock function for the bills
      mockStore.bills.mockImplementationOnce(() => ({
        update: updateMock
      }));
  
      // Prepare navigation and component setup
      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      });
  
      // Fill in the form with valid data
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Taxi to airport" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-10-20" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "120" } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "10" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Business trip" } });
  
      // Simulate file selection and change event
      const fileInput = screen.getByTestId("file");
      const validFile = new File(["file content"], "test.jpg", { type: "image/jpeg" });
      fireEvent.change(fileInput, { target: { files: [validFile] } });
  
      // Submit the form
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
  
      // Check that the API call was made
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        expect(updateMock).toHaveBeenCalled();
      });
  
      // Check navigation after form submission
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });
  
    test("Then it should handle errors when the API POST request fails", async () => {
      // Mock a failing POST request
      const updateMock = jest.fn().mockRejectedValue(new Error("API POST error"));
      mockStore.bills.mockImplementationOnce(() => ({
        update: updateMock
      }));
  
      // Prepare navigation and component setup
      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      });
  
      // Fill in the form with valid data
      fireEvent.change(screen.getByTestId("expense-type"), { target: { value: "Transports" } });
      fireEvent.change(screen.getByTestId("expense-name"), { target: { value: "Taxi to airport" } });
      fireEvent.change(screen.getByTestId("datepicker"), { target: { value: "2023-10-20" } });
      fireEvent.change(screen.getByTestId("amount"), { target: { value: "120" } });
      fireEvent.change(screen.getByTestId("vat"), { target: { value: "10" } });
      fireEvent.change(screen.getByTestId("pct"), { target: { value: "20" } });
      fireEvent.change(screen.getByTestId("commentary"), { target: { value: "Business trip" } });
  
      // Simulate file selection and change event
      const fileInput = screen.getByTestId("file");
      const validFile = new File(["file content"], "test.jpg", { type: "image/jpeg" });
      fireEvent.change(fileInput, { target: { files: [validFile] } });
  
      // Submit the form
      const form = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
  
      // Assert that an error was logged to the console
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        expect(updateMock).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(new Error("API POST error"));
      });
    });
  });
})