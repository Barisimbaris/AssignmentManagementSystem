const groupsState = {
  assignmentId: null,
  assignmentTitle: "",
  groups: []
};

const groupsSelectors = {
  page: () => document.getElementById("groupsPage"),
  assignmentTitle: () => document.getElementById("assignmentTitle"),
  groupsCount: () => document.getElementById("groupsCount"),
  groupsList: () => document.getElementById("groupsList")
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

const renderGroupsList = (groups = []) => {
  const container = groupsSelectors.groupsList();
  if (!container) return;

  if (!groups.length) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">👥</div>
        <p style="font-size: 1.2rem; color: #666;">Henüz grup oluşturulmamış</p>
      </div>
    `;
    return;
  }

  container.innerHTML = groups
    .map((group) => {
      const groupId = group.id || group.Id;
      const groupName = group.groupName || group.GroupName || "Grup";
      const leaderName = group.leaderName || group.LeaderName || "Bilinmiyor";
      const memberCount = group.members?.length || group.Members?.length || 0;
      const hasSubmission = group.hasSubmission || group.HasSubmission || false;
      
      return `
        <div class="assignment-card" style="cursor: pointer;" onclick="viewGroupDetail(${groupId}, '${groupName.replace(/'/g, "&#39;")}')">
          <div class="assignment-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1;">
              <strong>${groupName}</strong>
              <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
                👑 Lider: ${leaderName}
              </p>
            </div>
            <div style="background: #f5f5f5; padding: 0.75rem 1rem; border-radius: 8px; text-align: center;">
              <div style="font-size: 1.5rem; font-weight: bold; color: #667eea;">${memberCount}</div>
              <div style="font-size: 0.85rem; color: #666;">üye</div>
            </div>
          </div>
          
          <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #eee;">
            <div>
              ${hasSubmission ? 
                '<span style="background: #4CAF50; color: white; padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">✅ Teslim Edildi</span>' : 
                '<span style="background: #ff9800; color: white; padding: 0.5rem 1rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">⏳ Bekliyor</span>'
              }
            </div>
            <span style="font-size: 1.5rem; color: #ccc;">›</span>
          </div>
        </div>
      `;
    })
    .join("");
};

const loadGroups = async () => {
  const container = groupsSelectors.groupsList();
  const countSpan = groupsSelectors.groupsCount();
  
  if (container) {
    container.innerHTML = "<p>Yükleniyor...</p>";
  }

  try {
    const response = await apiFetch(`/Group/assignment/${groupsState.assignmentId}`);
    const groups = Array.isArray(response) ? response : (response?.data || response?.Data || []);
    
    groupsState.groups = groups;
    
    if (countSpan) {
      countSpan.textContent = `👥 ${groups.length} grup`;
    }
    
    renderGroupsList(groupsState.groups);
  } catch (error) {
    console.error("[loadGroups] Hata:", error);
    if (handleUnauthorized(error)) return;
    
    if (container) {
      container.innerHTML = `<p style="color:red">${error.message || "Gruplar yüklenirken hata oluştu"}</p>`;
    }
    showToast(error.message || "Gruplar yüklenirken hata oluştu", true);
  }
};

const viewGroupDetail = (groupId, groupName) => {
  window.location.href = `group-detail.html?groupId=${groupId}&groupName=${encodeURIComponent(groupName)}&assignmentTitle=${encodeURIComponent(groupsState.assignmentTitle)}`;
};

window.viewGroupDetail = viewGroupDetail;

const initGroupsPage = async () => {
  try {
    requireInstructorRole();
    
    // URL parametrelerini al
    const urlParams = new URLSearchParams(window.location.search);
    groupsState.assignmentId = parseInt(urlParams.get("assignmentId") || "", 10);
    groupsState.assignmentTitle = urlParams.get("assignmentTitle") || "Ödev";
    
    if (!groupsState.assignmentId) {
      showToast("Geçersiz ödev ID", true);
      setTimeout(() => {
        window.location.href = "assignments.html";
      }, 1500);
      return;
    }
    
    // Navigation menüsünü güncelle
    if (typeof updateNavigationByRole === "function") {
      updateNavigationByRole();
    }
    
    // Başlığı güncelle
    const titleEl = groupsSelectors.assignmentTitle();
    if (titleEl) {
      titleEl.textContent = groupsState.assignmentTitle;
    }
    
    await loadGroups();
  } catch (error) {
    console.error("[initGroupsPage] Hata:", error);
    showToast(error.message || "Sayfa yüklenirken hata oluştu", true);
    
    if (error.message.includes("giriş yapın") || error.message.includes("yetki")) {
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const page = groupsSelectors.page();
  if (!page) return;
  initGroupsPage();
});
