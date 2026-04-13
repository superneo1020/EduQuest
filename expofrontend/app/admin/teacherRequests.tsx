import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    TextInput,
    Modal,
    ActivityIndicator,
    SafeAreaView
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { 
    User, 
    Mail, 
    GraduationCap, 
    Check, 
    X, 
    Clock, 
    AlertCircle,
    RefreshCw,
    Search
} from "lucide-react-native";
import { TeacherRegistrationStorage, TeacherRegistrationRequest } from "../../src/utils/teacherRegistrationStorage";
import { useAuth } from "../../src/auth/AuthContext";
import { getApiBaseUrl } from "../../src/api/client";
import { adminService } from "../../src/services/adminService";

export default function TeacherRequests() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<TeacherRegistrationRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<TeacherRegistrationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
    const [selectedRequest, setSelectedRequest] = useState<TeacherRegistrationRequest | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        filterRequests();
    }, [requests, searchQuery, statusFilter]);

    const loadRequests = async () => {
        try {
            setLoading(true);
            const allRequests = await TeacherRegistrationStorage.getAllRequests();
            setRequests(allRequests.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
        } catch (error) {
            console.error("Error loading requests:", error);
            Alert.alert("Error", "Failed to load teacher requests");
        } finally {
            setLoading(false);
        }
    };

    const filterRequests = () => {
        let filtered = requests;

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter(req => req.status === statusFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(req => 
                req.username.toLowerCase().includes(query) ||
                req.email.toLowerCase().includes(query) ||
                req.schoolName.toLowerCase().includes(query)
            );
        }

        setFilteredRequests(filtered);
    };

    // teacherRequests.tsx - 修改 handleApprove 函數

    const handleApprove = async () => {
        if (!selectedRequest) return;

        setActionLoading(true);
        try {
            // Refresh the request data to get latest status
            const allRequests = await TeacherRegistrationStorage.getAllRequests();
            const currentRequest = allRequests.find(req => req.id === selectedRequest.id);

            if (!currentRequest) {
                throw new Error('Request not found');
            }

            if (currentRequest.status !== "pending") {
                throw new Error(`Request is not pending. Current status: ${currentRequest.status}`);
            }

            setSelectedRequest(currentRequest);

            // Update request status in local storage
            await TeacherRegistrationStorage.updateRequestStatus(
                currentRequest.id,
                "approved",
                adminNotes,
                user?.username
            );

            // Create the actual user account by calling the backend API
            const apiUrl = `${getApiBaseUrl()}/api/auth/register`;
            console.log('Creating teacher account at:', apiUrl);

            const requestBody = {
                username: currentRequest.username,
                email: currentRequest.email.trim(),
                password: currentRequest.password,
                isEducator: true,
                schoolName: currentRequest.schoolName
            };

            let response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            // If school not found, try with null schoolName
            if (!response.ok) {
                const errorText = await response.text();
                console.error('First attempt failed:', response.status, errorText);

                if (response.status === 404 && errorText.includes('School not found')) {
                    console.log('School not found, trying with null schoolName...');

                    const fallbackRequestBody = {
                        ...requestBody,
                        schoolName: null
                    };

                    response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(fallbackRequestBody)
                    });
                }
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Backend response:', response.status, errorText);
                throw new Error(`Server error (${response.status}): ${errorText}`);
            }

            const userData = await response.json();
            console.log('User created successfully:', userData);

            // 嘗試激活用戶並更新 educatorStatus
            if (userData && userData.id) {
                console.log('Activating user account for ID:', userData.id);

                try {
                    // 調用 activate API（這會設置 isActive = true）
                    const activationSuccess = await adminService.activateUser(userData.id);

                    if (activationSuccess) {
                        console.log('User activation successful');

                        // 注意：educatorStatus 仍然是 PENDING
                        // 需要後端提供 approve API 來更新 educatorStatus

                        Alert.alert(
                            "Success",
                            `Teacher account created and activated!\n\nUser ID: ${userData.id}\nUsername: ${userData.username}\n\nNote: Educator status will be updated to APPROVED after backend approval.`,
                            [
                                {
                                    text: "OK",
                                    onPress: () => {
                                        console.log('Admin acknowledged');
                                    }
                                }
                            ]
                        );
                    } else {
                        throw new Error('Activation failed');
                    }
                } catch (activationError) {
                    console.error('Activation failed:', activationError);
                    Alert.alert(
                        "Partial Success",
                        `Teacher account created but activation failed.\n\nUser ID: ${userData.id}\nUsername: ${userData.username}\n\nPlease manually activate in database:\nUPDATE users SET is_active = true, educator_status = 'APPROVED' WHERE id = ${userData.id};`,
                        [{ text: "OK" }]
                    );
                }
            } else {
                Alert.alert("Success", "Teacher registration approved and account created successfully!");
            }

            setModalVisible(false);
            setSelectedRequest(null);
            setAdminNotes("");

            await loadRequests();
        } catch (error) {
            console.error("Error approving request:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to approve request. Please try again.";
            Alert.alert("Error", errorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;

        setActionLoading(true);
        try {
            await TeacherRegistrationStorage.updateRequestStatus(
                selectedRequest.id,
                "rejected",
                adminNotes,
                user?.username
            );

            Alert.alert("Success", "Teacher registration rejected successfully!");
            setModalVisible(false);
            setSelectedRequest(null);
            setAdminNotes("");
            loadRequests();
        } catch (error) {
            console.error("Error rejecting request:", error);
            Alert.alert("Error", "Failed to reject request. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const openRequestModal = async (request: TeacherRegistrationRequest) => {
        // Refresh requests to get latest status before opening modal
        await loadRequests();
        
        // Get the latest request data
        const allRequests = await TeacherRegistrationStorage.getAllRequests();
        const latestRequest = allRequests.find(req => req.id === request.id);
        
        if (!latestRequest) {
            Alert.alert("Error", "Request not found");
            return;
        }
        
        // Don't open modal if request is not pending
        if (latestRequest.status !== "pending") {
            Alert.alert("Info", `This request has already been ${latestRequest.status}.`);
            return;
        }
        
        setSelectedRequest(latestRequest);
        setAdminNotes(latestRequest.adminNotes || "");
        setModalVisible(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "#FF9800";
            case "approved": return "#4CAF50";
            case "rejected": return "#F44336";
            default: return "#9E9E9E";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending": return <Clock size={16} color="#FFF" />;
            case "approved": return <Check size={16} color="#FFF" />;
            case "rejected": return <X size={16} color="#FFF" />;
            default: return <AlertCircle size={16} color="#FFF" />;
        }
    };

    const RequestCard = ({ request }: { request: TeacherRegistrationRequest }) => (
        <TouchableOpacity 
            style={styles.requestCard}
            onPress={() => openRequestModal(request)}
        >
            <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                    <Text style={styles.requestUsername}>{request.username}</Text>
                    <Text style={styles.requestEmail}>{request.email}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    {getStatusIcon(request.status)}
                    <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
                </View>
            </View>
            
            <View style={styles.requestDetails}>
                <View style={styles.detailRow}>
                    <GraduationCap size={16} color="#666" />
                    <Text style={styles.detailText}>{request.schoolName}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Clock size={16} color="#666" />
                    <Text style={styles.detailText}>
                        {new Date(request.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>
            
            {request.reason && (
                <Text style={styles.reasonText} numberOfLines={2}>
                    "{request.reason}"
                </Text>
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading teacher requests...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Teacher Registration Requests</Text>
                <TouchableOpacity onPress={loadRequests} style={styles.refreshBtn}>
                    <RefreshCw size={20} color="#4CAF50" />
                </TouchableOpacity>
            </View>

            {/* Search and Filter */}
            <View style={styles.filterSection}>
                <View style={styles.searchBar}>
                    <Search size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by username, email, or school..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#999"
                    />
                </View>
                
                <View style={styles.filterButtons}>
                    {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.filterBtn,
                                statusFilter === status && styles.filterBtnActive
                            ]}
                            onPress={() => setStatusFilter(status)}
                        >
                            <Text style={[
                                styles.filterBtnText,
                                statusFilter === status && styles.filterBtnTextActive
                            ]}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Requests List */}
            <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
                {filteredRequests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <AlertCircle size={48} color="#CCC" />
                        <Text style={styles.emptyText}>No teacher requests found</Text>
                        <Text style={styles.emptySubText}>
                            {statusFilter === "pending" 
                                ? "No pending requests at the moment"
                                : "Try adjusting your search or filter"
                            }
                        </Text>
                    </View>
                ) : (
                    filteredRequests.map((request) => (
                        <RequestCard key={request.id} request={request} />
                    ))
                )}
            </ScrollView>

            {/* Request Detail Modal */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Request Details</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <X size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {selectedRequest && (
                        <ScrollView style={styles.modalContent}>
                            <View style={styles.detailSection}>
                                <Text style={styles.sectionTitle}>Applicant Information</Text>
                                <View style={styles.infoRow}>
                                    <User size={20} color="#666" />
                                    <Text style={styles.infoLabel}>Username:</Text>
                                    <Text style={styles.infoValue}>{selectedRequest.username}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Mail size={20} color="#666" />
                                    <Text style={styles.infoLabel}>Email:</Text>
                                    <Text style={styles.infoValue}>{selectedRequest.email}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <GraduationCap size={20} color="#666" />
                                    <Text style={styles.infoLabel}>School:</Text>
                                    <Text style={styles.infoValue}>{selectedRequest.schoolName}</Text>
                                </View>
                            </View>

                            <View style={styles.detailSection}>
                                <Text style={styles.sectionTitle}>Reason for Application</Text>
                                <Text style={styles.reasonFullText}>{selectedRequest.reason}</Text>
                            </View>

                            <View style={styles.detailSection}>
                                <Text style={styles.sectionTitle}>Admin Notes</Text>
                                <TextInput
                                    style={styles.notesInput}
                                    placeholder="Add your notes here..."
                                    value={adminNotes}
                                    onChangeText={setAdminNotes}
                                    multiline
                                    numberOfLines={4}
                                    placeholderTextColor="#999"
                                />
                            </View>

                            {selectedRequest.status === "pending" && (
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.rejectBtn]}
                                        onPress={handleReject}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <>
                                                <X size={20} color="#FFF" />
                                                <Text style={styles.actionBtnText}>Reject</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.approveBtn]}
                                        onPress={handleApprove}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <>
                                                <Check size={20} color="#FFF" />
                                                <Text style={styles.actionBtnText}>Approve</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#2D3436",
    },
    refreshBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: "#F0F0F0",
    },
    filterSection: {
        padding: 20,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: "#333",
    },
    filterButtons: {
        flexDirection: "row",
        gap: 10,
    },
    filterBtn: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: "#F5F5F5",
        alignItems: "center",
    },
    filterBtnActive: {
        backgroundColor: "#4CAF50",
    },
    filterBtnText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
    },
    filterBtnTextActive: {
        color: "#FFF",
    },
    requestsList: {
        flex: 1,
        padding: 20,
    },
    requestCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    requestHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    requestInfo: {
        flex: 1,
    },
    requestUsername: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2D3436",
        marginBottom: 4,
    },
    requestEmail: {
        fontSize: 14,
        color: "#666",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFF",
    },
    requestDetails: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: "#666",
    },
    reasonText: {
        fontSize: 14,
        color: "#888",
        fontStyle: "italic",
        lineHeight: 18,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#666",
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: "#999",
        marginTop: 8,
        textAlign: "center",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#FFF",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2D3436",
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    detailSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2D3436",
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        gap: 12,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        width: 80,
    },
    infoValue: {
        flex: 1,
        fontSize: 14,
        color: "#333",
    },
    reasonFullText: {
        fontSize: 14,
        color: "#333",
        lineHeight: 20,
        backgroundColor: "#F8F9FA",
        padding: 12,
        borderRadius: 8,
    },
    notesInput: {
        backgroundColor: "#F8F9FA",
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: "#333",
        minHeight: 100,
        textAlignVertical: "top",
    },
    actionButtons: {
        flexDirection: "row",
        gap: 12,
        marginTop: 20,
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    approveBtn: {
        backgroundColor: "#4CAF50",
    },
    rejectBtn: {
        backgroundColor: "#F44336",
    },
    actionBtnText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFF",
    },
});
