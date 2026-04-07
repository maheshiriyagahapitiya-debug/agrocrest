<?php
/**
 * AGRO CREAST ERP - PHP API Backend
 * This script handles all CRUD operations and connects to MySQL.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Database Configuration
$host = "localhost";
$db_name = "agro_erp";
$username = "root";
$password = ""; // Default WAMP password is empty

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(["error" => "Connection failed: " . $e->getMessage()]));
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Helper to get JSON input
function get_input() {
    return json_decode(file_get_contents("php://input"), true);
}

switch ($action) {
    case 'get_db':
        $db = [
            "customers" => $conn->query("SELECT * FROM customers")->fetchAll(PDO::FETCH_ASSOC),
            "employees" => $conn->query("SELECT * FROM employees")->fetchAll(PDO::FETCH_ASSOC),
            "loans" => $conn->query("SELECT * FROM loans")->fetchAll(PDO::FETCH_ASSOC),
            "tasks" => $conn->query("SELECT * FROM tasks")->fetchAll(PDO::FETCH_ASSOC),
            "inventory" => $conn->query("SELECT * FROM inventory")->fetchAll(PDO::FETCH_ASSOC),
            "hrDocuments" => $conn->query("SELECT * FROM hr_documents")->fetchAll(PDO::FETCH_ASSOC)
        ];
        
        // Decode JSON fields
        foreach ($db['loans'] as &$loan) {
            $loan['repaymentSchedule'] = json_decode($loan['repaymentSchedule'], true);
            $loan['payments'] = $conn->prepare("SELECT * FROM payments WHERE loanId = ?");
            $loan['payments']->execute([$loan['id']]);
            $loan['payments'] = $loan['payments']->fetchAll(PDO::FETCH_ASSOC);
        }
        
        echo json_encode($db);
        break;

    case 'add_customer':
        $data = get_input();
        $stmt = $conn->prepare("INSERT INTO customers (id, membershipNo, name, address, telephone, idNo, age, birthday, email, maritalStatus, nationality, assignedExecutiveId, createdAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'], $data['membershipNo'], $data['name'], $data['address'], $data['telephone'], 
            $data['idNo'], $data['age'], $data['birthday'], $data['email'], $data['maritalStatus'], 
            $data['nationality'], $data['assignedExecutiveId'], $data['createdAt'], $data['status']
        ]);
        echo json_encode(["success" => true]);
        break;

    case 'update_customer':
        $data = get_input();
        $stmt = $conn->prepare("UPDATE customers SET name=?, address=?, telephone=?, idNo=?, age=?, birthday=?, email=?, maritalStatus=?, nationality=?, assignedExecutiveId=?, status=? WHERE id=?");
        $stmt->execute([
            $data['name'], $data['address'], $data['telephone'], $data['idNo'], $data['age'], 
            $data['birthday'], $data['email'], $data['maritalStatus'], $data['nationality'], 
            $data['assignedExecutiveId'], $data['status'], $data['id']
        ]);
        echo json_encode(["success" => true]);
        break;

    case 'add_loan':
        $data = get_input();
        $stmt = $conn->prepare("INSERT INTO loans (id, customerId, amount, interestRate, termMonths, startDate, status, executiveId, appraisalDetails, repaymentSchedule, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'], $data['customerId'], $data['amount'], $data['interestRate'], $data['termMonths'], 
            $data['startDate'], $data['status'], $data['executiveId'], $data['appraisalDetails'], 
            json_encode($data['repaymentSchedule']), $data['createdAt']
        ]);
        echo json_encode(["success" => true]);
        break;

    case 'update_loan':
        $data = get_input();
        $stmt = $conn->prepare("UPDATE loans SET status=?, approvedBy=?, appraisalDetails=?, repaymentSchedule=? WHERE id=?");
        $stmt->execute([
            $data['status'], $data['approvedBy'], $data['appraisalDetails'], 
            json_encode($data['repaymentSchedule']), $data['id']
        ]);
        echo json_encode(["success" => true]);
        break;

    case 'add_payment':
        $data = get_input();
        $stmt = $conn->prepare("INSERT INTO payments (id, receiptNo, loanId, amount, date, method, balanceAfter) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'], $data['receiptNo'], $data['loanId'], $data['amount'], 
            $data['date'], $data['method'], $data['balanceAfter']
        ]);
        echo json_encode(["success" => true]);
        break;

    case 'add_employee':
        $data = get_input();
        $stmt = $conn->prepare("INSERT INTO employees (id, name, designation, email, password, branchId) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'], $data['name'], $data['designation'], $data['email'], $data['password'], $data['branchId']
        ]);
        echo json_encode(["success" => true]);
        break;

    case 'update_employee':
        $data = get_input();
        $stmt = $conn->prepare("UPDATE employees SET name=?, designation=?, email=?, branchId=? WHERE id=?");
        $stmt->execute([
            $data['name'], $data['designation'], $data['email'], $data['branchId'], $data['id']
        ]);
        echo json_encode(["success" => true]);
        break;

    case 'delete_employee':
        $id = $_GET['id'];
        $stmt = $conn->prepare("DELETE FROM employees WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
        break;

    case 'add_hr_document':
        $data = get_input();
        $stmt = $conn->prepare("INSERT INTO hr_documents (id, employeeId, type, date, content) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'], $data['employeeId'], $data['type'], $data['date'], $data['content']
        ]);
        echo json_encode(["success" => true]);
        break;

    case 'add_task':
        $data = get_input();
        $stmt = $conn->prepare("INSERT INTO tasks (id, title, description, assignedToId, customerId, status, dueDate, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['id'], $data['title'], $data['description'], $data['assignedToId'], 
            $data['customerId'], $data['status'], $data['dueDate'], $data['createdAt']
        ]);
        echo json_encode(["success" => true]);
        break;

    case 'update_task':
        $data = get_input();
        $stmt = $conn->prepare("UPDATE tasks SET status=? WHERE id=?");
        $stmt->execute([$data['status'], $data['id']]);
        echo json_encode(["success" => true]);
        break;

    case 'update_inventory':
        $data = get_input();
        $stmt = $conn->prepare("UPDATE inventory SET quantity=?, lastUpdated=? WHERE id=?");
        $stmt->execute([$data['quantity'], $data['lastUpdated'], $data['id']]);
        echo json_encode(["success" => true]);
        break;

    default:
        echo json_encode(["error" => "Invalid action"]);
        break;
}
?>
