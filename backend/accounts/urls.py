from django.urls import path

from .views import  (
	LoginView,
	RefreshView,
	LogoutView,
	CurrentUserView,
)

urlpatterns = [
	path('login/', LoginView.as_view(), name='login'),
	path('refresh/', RefreshView.as_view(), name='token_refresh'),
	path('logout/', LogoutView.as_view(), name='logout'),
	path('me/', CurrentUserView.as_view(), name='current_user'),
]
