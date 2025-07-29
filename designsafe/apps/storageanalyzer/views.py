from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework import authentication, permissions
import os

from apps.storageanalyzer.ml.analyzer import analyze_user_storage


@api_view(['POST'])
@authentication_classes([authentication.TokenAuthentication])
@permission_classes([permissions.IsAuthenticated])
def analyze_storage(request):
    username = request.user.username
    user_base_path = f'/corral-repl/tacc/NHERI/shared/users/{username}/'
    results = analyze_user_storage(user_base_path)
    return Response(results)


@api_view(['POST'])
@authentication_classes([authentication.TokenAuthentication])
@permission_classes([permissions.IsAuthenticated])
def archive_files(request):
    username = request.user.username
    files = request.data.get('files', [])
    user_root = f'/corral-repl/tacc/NHERI/shared/users/{username}/'
    archive_root = os.path.join(user_root, 'archive')

    os.makedirs(archive_root, exist_ok=True)

    for file_path in files:
        try:
            rel_path = os.path.relpath(file_path, user_root)
            new_path = os.path.join(archive_root, rel_path)
            os.makedirs(os.path.dirname(new_path), exist_ok=True)
            os.rename(file_path, new_path)
        except Exception as e:
            print(f"Failed to archive {file_path}: {e}")

    return Response({'status': 'archived'})
