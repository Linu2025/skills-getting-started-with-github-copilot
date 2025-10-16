document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        let participantsHTML = "";
        const participants = details.participants || [];

        if (participants.length === 0) {
          participantsHTML = `<p class="participants-empty">No participants yet</p>`;
        } else {
          participantsHTML = `<ul class="participants">`;
          participants.forEach((email) => {
            const local = String(email).split("@")[0] || email;
            const initials = local
              .split(/[\.\-_ ]+/)
              .map((s) => (s ? s[0].toUpperCase() : ""))
              .join("")
              .slice(0, 2);
            const displayName = local;
            // Each participant item includes a data-email attribute for identification
            participantsHTML += `
              <li class="participant-item" data-email="${email}" data-activity="${encodeURIComponent(
              name
            )}">
                <span class="participant-badge">${initials}</span>
                <span class="participant-name">${displayName}</span>
                <button class="participant-delete" title="Remove participant" aria-label="Remove ${displayName}" data-email="${email}" data-activity="${encodeURIComponent(
                  name
                )}">✕</button>
              </li>
            `;
          });
          participantsHTML += `</ul>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <h4 style="margin:10px 0 6px 0; font-size:14px; color:#1a237e;">Participants</h4>
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
        // Attach click handlers to delete buttons (use event delegation)
        document.querySelectorAll('.participant-delete').forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const email = btn.getAttribute('data-email');
            const activityName = decodeURIComponent(btn.getAttribute('data-activity'));

            if (!email || !activityName) return;

            // Confirm deletion
            const ok = confirm(`Unregister ${email} from ${activityName}?`);
            if (!ok) return;

            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(
                  email
                )}`,
                { method: 'DELETE' }
              );

              const result = await resp.json();
              if (resp.ok) {
                // Remove the participant item from the DOM
                const li = btn.closest('.participant-item');
                if (li) li.remove();
                messageDiv.textContent = result.message;
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              } else {
                messageDiv.textContent = result.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Failed to remove participant. Please try again.';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
            }
          });
        });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
