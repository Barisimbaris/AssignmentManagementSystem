const groupDetailState = {
  groupId: null,
  groupName: "",
  assignmentTitle: "",
  group: null
};

const groupDetailSelectors = {
  page: () => document.getElementById("groupDetailPage"),
  groupNameTitle: () => document.getElementById("groupNameTitle"),
  groupName: () => document.getElementById("groupName"),
  assignmentTitle: () => document.getElementById("assignmentTitle"),
  statusBadge: () => document.getElementById("statusBadge"),
  memberCount: () => document.getElementById("memberCount"),
  membersList: () => document.getElementById("membersList"),
  groupDetails: () => document.getElementById("groupDetails")
};

const requireInstructorRole = () => {
  const user = getAuthUser();
  if (!user) {
    throw new Error("Lütfen giriş yapın");
  }
  if ((user.role || "").toLowerCase() !== "instructor" && (user.role || "").toLowerCase() !== "admin") {
    throw new Error("Bu sayfa sadece öğretmenler içindir");
  }
  return user;
};

const handleUnauthorized = (error) => {
  if (error?.status === 401) {
    showToast("Oturumunuzun süresi doldu, lütfen tekrar giriş yapın.", true);
    clearAuthSession();
    setTimeout(() => {
      window.location.href = "login.html";
    }, 800);
    return true;
  }
  return false;
};

const renderGroupDetails = (group) => {
  if (!group) return;

  // Başlık
  const groupNameTitle = groupDetailSelectors.groupNameTitle();
  const groupNameEl = groupDetailSelectors.groupName();
  const assignmentTitleEl = groupDetailSelectors.assignmentTitle();
  
  if (groupNameTitle) {
    groupNameTitle.textContent = group.groupName || group.GroupName || "Grup Detayı";
  }
  if (groupNameEl) {
    groupNameEl.textContent = group.groupName || group.GroupName || "Grup";
  }
  if (assignmentTitleEl) {
    assignmentTitleEl.textContent = groupDetailState.assignmentTitle;
  }

  // Durum badge
  const statusBadge = groupDetailSelectors.statusBadge();
  if (statusBadge) {
    const hasSubmission = group.hasSubmission || group.HasSubmission || false;
    statusBadge.innerHTML = hasSubmission
      ? '<span style="background: #4CAF50; color: white; padding: 0.75rem 1.5rem; border-radius: 12px; font-size: 0.9rem; font-weight: 600;">✅ Teslim Edildi</span>'
      : '<span style="background: #ff9800; color: white; padding: 0.75rem 1.5rem; border-radius: 12px; font-size: 0.9rem; font-weight: 600;">⏳ Teslim Bekleniyor</span>';
  }

  // Üyeler
  const members = group.members || group.Members || [];
  const memberCount = groupDetailSelectors.memberCount();
  const membersList = groupDetailSelectors.membersList();
  
  if (memberCount) {
    memberCount.textContent = members.length;
  }
  
  if (membersList) {
    if (members.length === 0) {
      membersList.innerHTML = "<p style='color: #666; text-align: center; padding: 2rem;'>Henüz üye yok</p>";
    } else {
      membersList.innerHTML = members
        .map((member) => {
          const isLeader = member.isLeader || member.IsLeader || false;
          const studentName = member.studentName || member.StudentName || "Bilinmiyor";
          const studentNumber = member.studentNumber || member.StudentNumber || "";
          
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem;">
              <div style="flex: 1;">
                <p style="font-weight: 600; margin-bottom: 0.25rem;">
                  ${isLeader ? '👑 ' : ''}${studentName}
                </p>
                ${studentNumber ? `<p style="font-size: 0.85rem; color: #666;">${studentNumber}</p>` : ''}
              </div>
              ${isLeader ? `
                <span style="background: #667eea; color: white; padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">Lider</span>
              ` : ''}
            </div>
          `;
        })
        .join("");
    }
  }

  // Grup bilgileri
  const groupDetails = groupDetailSelectors.groupDetails();
  if (groupDetails) {
    const createdAt = group.createdAt || group.CreatedAt;
    const leaderName = group.leaderName || group.LeaderName || "Bilinmiyor";
    
    groupDetails.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #eee;">
        <span style="color: #666;">Oluşturulma Tarihi:</span>
        <span style="font-weight: 600;">
          ${createdAt ? new Date(createdAt).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric"
          }) : "-"}
        </span>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0;">
        <span style="color: #666;">Grup Lideri:</span>
        <span style="font-weight: 600;">${leaderName}</span>
      </div>
    `;
  }
};

const loadGroupDetails = async () => {
  const membersList = groupDetailSelectors.membersList();
  
  if (membersList) {
    membersList.innerHTML = "<p>Yükleniyor...</p>";
  }

  try {
    const response = await apiFetch(`/Group/${groupDetailState.groupId}`);
    const group = response?.data || response;
    
    groupDetailState.group = group;
    renderGroupDetails(group);
  } catch (error) {
    console.error("[loadGroupDetails] Hata:", error);
    if (handleUnauthorized(error)) return;
    
    if (membersList) {
      membersList.innerHTML = `<p style="color:red">${error.message || "Grup detayları yüklenirken hata oluştu"}</p>`;
    }
    showToast(error.message || "Grup detayları yüklenirken hata oluştu", true);
  }
};

const initGroupDetailPage = async () => {
  try {
    requireInstructorRole();
    
    // URL parametrelerini al
    const urlParams = new URLSearchParams(window.location.search);
    groupDetailState.groupId = parseInt(urlParams.get("groupId") || "", 10);
    groupDetailState.groupName = urlParams.get("groupName") || "Grup";
    groupDetailState.assignmentTitle = urlParams.get("assignmentTitle") || "Ödev";
    
    if (!groupDetailState.groupId) {
      showToast("Geçersiz grup ID", true);
      setTimeout(() => {
        window.location.href = "assignments.html";
      }, 1500);
      return;
    }
    
    // Navigation menüsünü güncelle
    if (typeof updateNavigationByRole === "function") {
      updateNavigationByRole();
    }
    
    await loadGroupDetails();
  } catch (error) {
    console.error("[initGroupDetailPage] Hata:", error);
    showToast(error.message || "Sayfa yüklenirken hata oluştu", true);
    
    if (error.message.includes("giriş yapın") || error.message.includes("yetki")) {
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const page = groupDetailSelectors.page();
  if (!page) return;
  initGroupDetailPage();
});
